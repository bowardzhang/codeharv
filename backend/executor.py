import ast
import time

class ScriptError(Exception):
    def __init__(self, node, message):
        self.lineno = getattr(node, "lineno", None)
        self.message = message
        super().__init__(self.__str__())

    def __str__(self):
        if self.lineno:
            return f"Line {self.lineno}: {self.message}"
        return self.message

class _BreakSignal(Exception):
    """Internal signal for break statement."""
    pass

class _ContinueSignal(Exception):
    """Internal signal for continue statement."""
    pass

class Executor:
    MAX_STEPS = 500
    MAX_TIMEOUT = 1800
    MAX_WHILE_ITERATIONS = 200
    TIME_PER_STEP = 1.0

    def __init__(self, tree, farm, is_manual=False):
        self.stack = list(reversed(tree.body))
        self.ctx = {}
        self.farm = farm
        self.steps = 0
        self.code_text = ast.unparse(tree) if hasattr(ast, "unparse") else ""

        # Track which functions were called (for mission checking)
        self.called_functions: set = set()

        # mark start time only if all script runs automatically in one batch
        self.start_time = None if is_manual else time.time()

    def step(self):
        if not self.stack:
            return None  # terminate code execution

        self.steps += 1
        node = self.stack.pop()

        # Handle tuple unpacking assignment from for-loop
        if isinstance(node, tuple) and node[0] == "_unpack_assign":
            _, target, value = node
            self._assign_target(target, value)
            return self.step()

        # Handle loop sentinels (reached naturally = loop iteration boundary)
        if isinstance(node, tuple) and node[0] in ("_loop_end", "_loop_iter"):
            return self.step()

        if self.start_time and time.time() - self.start_time > self.MAX_TIMEOUT:
            raise ScriptError(node, "Script timeout")

        if self.steps > self.MAX_STEPS:
            raise ScriptError(node, "Script exceeded maximum execution steps")

        # farm time elapses 1 second for each execution step
        self.farm.tick(self.TIME_PER_STEP)

        # if / else
        if isinstance(node, ast.If):
            condition = self.eval(node.test)
            body = node.body if condition else node.orelse
            for stmt in reversed(body):
                self.stack.append(stmt)
            return self.step()

        # for loop
        if isinstance(node, ast.For):
            iterable = self.eval(node.iter)
            target = node.target

            # Push loop-end sentinel first (bottom of stack for this loop)
            self.stack.append(("_loop_end",))
            for value in reversed(iterable):
                # Push iteration separator sentinel
                self.stack.append(("_loop_iter",))
                for stmt in reversed(node.body):
                    self.stack.append(stmt)
                # Support tuple unpacking: for x, y in ...
                self.stack.append(("_unpack_assign", target, value))
            return self.step()

        # while loop (with iteration guard)
        if isinstance(node, ast.While):
            return self._exec_while(node)

        # assignment
        if isinstance(node, ast.Assign):
            value = self.eval(node.value)
            self._assign_target(node.targets[0], value)
            return self.step()

        # augmented assignment (+=, -=, *=, etc.)
        if isinstance(node, ast.AugAssign):
            target_name = node.target.id
            current = self.ctx.get(target_name, 0)
            value = self.eval(node.value)
            result = self._apply_binop(node.op, current, value, node)
            self.ctx[target_name] = result
            return self.step()

        # pass (no-op)
        if isinstance(node, ast.Pass):
            return self.step()

        # break statement - pop stack until loop-end sentinel
        if isinstance(node, ast.Break):
            while self.stack:
                top = self.stack.pop()
                if isinstance(top, tuple) and top[0] == "_loop_end":
                    break
            return self.step()

        # continue statement - pop stack until loop-iter sentinel
        if isinstance(node, ast.Continue):
            while self.stack:
                top = self.stack.pop()
                if isinstance(top, tuple) and top[0] == "_loop_iter":
                    break
                if isinstance(top, tuple) and top[0] == "_loop_end":
                    # Continue at end of loop means just exit
                    break
            return self.step()

        # return at top level is an error
        if isinstance(node, ast.Return):
            raise ScriptError(node, "'return' outside function")

        # user-defined function
        if isinstance(node, ast.FunctionDef):
            self._define_function(node)
            return self.step()

        # expr(function call)
        if isinstance(node, ast.Expr):
            result = self.exec_expr(node.value)
            if result is None:
                return self.step()  # No event produced (e.g. print), continue
            return result

        raise ScriptError(node, "Unsupported syntax")

    def _assign_target(self, target, value):
        """Assign a value to a target, supporting tuple unpacking."""
        if isinstance(target, ast.Name):
            self.ctx[target.id] = value
        elif isinstance(target, ast.Tuple) or isinstance(target, ast.List):
            # Tuple/list unpacking: for x, y in ...
            try:
                values = list(value)
            except TypeError:
                raise ScriptError(target, f"Cannot unpack non-iterable {type(value).__name__}")
            if len(target.elts) != len(values):
                raise ScriptError(target, f"Cannot unpack: expected {len(target.elts)} values, got {len(values)}")
            for t, v in zip(target.elts, values):
                self._assign_target(t, v)
        else:
            raise ScriptError(target, "Unsupported assignment target")

    def _exec_while(self, node):
        """Execute a while loop with iteration guard."""
        iterations = 0
        last_ev = None
        while iterations < self.MAX_WHILE_ITERATIONS:
            condition = self.eval(node.test)
            if not condition:
                break
            iterations += 1
            # Execute body statements sequentially inline
            try:
                for stmt in node.body:
                    self.steps += 1
                    if self.steps > self.MAX_STEPS:
                        raise ScriptError(node, "Script exceeded maximum execution steps")
                    self.farm.tick(self.TIME_PER_STEP)

                    ev = self._step_one(stmt)
                    if ev is not None:
                        last_ev = ev
            except _BreakSignal:
                break
            except _ContinueSignal:
                continue
        else:
            raise ScriptError(node, f"While loop exceeded {self.MAX_WHILE_ITERATIONS} iterations")

        # After while finishes, continue with next in stack
        if last_ev is not None:
            return last_ev
        return self.step()

    def _define_function(self, node):
        """Store a user-defined function in self.ctx as a callable wrapper."""
        func_name = node.name
        param_names = [arg.arg for arg in node.args.args]
        body = node.body

        def user_func(*args):
            # Save current context and set parameters
            saved = dict(self.ctx)
            for pname, pval in zip(param_names, args):
                self.ctx[pname] = pval
            # Execute body statements
            result = None
            for stmt in body:
                if isinstance(stmt, ast.Return):
                    result = self.eval(stmt.value) if stmt.value else None
                    break
                self.steps += 1
                if self.steps > self.MAX_STEPS:
                    raise ScriptError(node, "Script exceeded maximum execution steps")
                self.farm.tick(self.TIME_PER_STEP)
                ev = self._step_one(stmt)
                if ev is not None:
                    result = ev
            # Restore context (but keep any new variables from outer scope)
            for pname in param_names:
                if pname in saved:
                    self.ctx[pname] = saved[pname]
                elif pname in self.ctx:
                    del self.ctx[pname]
            return result

        self.ctx[func_name] = user_func

    def _step_one(self, node):
        """Execute a single node inline (used by while loop)."""
        if isinstance(node, ast.If):
            condition = self.eval(node.test)
            body = node.body if condition else node.orelse
            last_ev = None
            for stmt in body:
                ev = self._step_one(stmt)
                if ev is not None:
                    last_ev = ev
            return last_ev

        if isinstance(node, ast.For):
            iterable = self.eval(node.iter)
            target = node.target
            last_ev = None
            for value in iterable:
                self._assign_target(target, value)
                try:
                    for stmt in node.body:
                        self.steps += 1
                        if self.steps > self.MAX_STEPS:
                            raise ScriptError(node, "Script exceeded maximum execution steps")
                        self.farm.tick(self.TIME_PER_STEP)
                        ev = self._step_one(stmt)
                        if ev is not None:
                            last_ev = ev
                except _BreakSignal:
                    break
                except _ContinueSignal:
                    continue
            return last_ev

        if isinstance(node, ast.While):
            return self._exec_while(node)

        if isinstance(node, ast.Assign):
            value = self.eval(node.value)
            self._assign_target(node.targets[0], value)
            return None

        if isinstance(node, ast.AugAssign):
            target_name = node.target.id
            current = self.ctx.get(target_name, 0)
            value = self.eval(node.value)
            result = self._apply_binop(node.op, current, value, node)
            self.ctx[target_name] = result
            return None

        if isinstance(node, ast.Pass):
            return None

        if isinstance(node, ast.Break):
            raise _BreakSignal()

        if isinstance(node, ast.Continue):
            raise _ContinueSignal()

        if isinstance(node, ast.FunctionDef):
            self._define_function(node)
            return None

        if isinstance(node, ast.Expr):
            return self.exec_expr(node.value)

        raise ScriptError(node, "Unsupported syntax")

    def exec_expr(self, node):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
            obj = self.eval(node.func.value)
            method_name = node.func.attr
            args = [self.eval(a) for a in node.args]
            SAFE_METHODS = {
                'keys', 'values', 'items', 'get',
                'upper', 'lower', 'strip', 'split', 'join', 'replace',
                'startswith', 'endswith', 'count', 'index',
                'append', 'pop', 'sort', 'reverse', 'copy',
            }
            if method_name in SAFE_METHODS:
                method = getattr(obj, method_name, None)
                if method and callable(method):
                    return method(*args)
            raise ScriptError(node, f"Unsupported method: {method_name}")
        if isinstance(node, ast.Call):
            return self.exec_call(node)
        raise ScriptError(node, "Only function calls allowed")

    def exec_call(self, node):
        func = node.func.id
        args = [self.eval(arg) for arg in node.args]

        line_no = getattr(node, "lineno", None)

        self.called_functions.add(func)

        # Check user-defined functions first
        if func in self.ctx and callable(self.ctx[func]):
            result = self.ctx[func](*args)
            if isinstance(result, dict):
                result["line"] = line_no
            return result

        if func == "plant":
            ev = self.farm.plant(*args)
        elif func == "water":
            ev = self.farm.water(*args)
        elif func == "fertilize":
            ev = self.farm.fertilize(*args)
        elif func == "harvest":
            ev = self.farm.harvest(*args)
        elif func == "wait":
            ev = self.farm.wait(*args)
        elif func == "is_mature":
            return self.farm.is_mature(*args)
        elif func == "clear":
            ev = self.farm.clear_field(*args)
        elif func == "get_weather":
            return self.farm.get_weather()
        elif func == "get_status":
            return self.farm.get_status(*args)
        elif func == "get_gold":
            return self.farm.get_gold()
        elif func == "get_time":
            return self.farm.get_time()
        elif func == "get_all_mature":
            return self.farm.get_all_mature()
        elif func == "get_all_planted":
            return self.farm.get_all_planted()
        elif func == "count_crops":
            return self.farm.count_crops()
        elif func == "get_price":
            return self.farm.get_price(*args)
        elif func == "sell":
            ev = self.farm.sell(*args)
        elif func == "get_market":
            return self.farm.get_market()
        elif func == "has_pest":
            return self.farm.has_pest(*args)
        elif func == "remove_pest":
            ev = self.farm.remove_pest(*args)
        elif func == "get_pests":
            return self.farm.get_pests()
        elif func == "get_season":
            return self.farm.get_season()
        elif func == "print":
            msg = " ".join(str(a) for a in args)
            self.farm.print_log.append(msg)
            return None  # print doesn't produce a farm event
        elif func == "len":
            if len(args) != 1:
                raise ScriptError(node, "len() takes exactly 1 argument")
            return len(args[0])
        elif func == "range":
            try:
                return range(*args)
            except TypeError:
                raise ScriptError(node, "Invalid range() arguments")
        elif func == "enumerate":
            if not args or len(args) > 2:
                raise ScriptError(node, "enumerate() takes 1 or 2 arguments")
            start = args[1] if len(args) == 2 else 0
            return list(enumerate(args[0], start))
        elif func == "sorted":
            if len(args) != 1:
                raise ScriptError(node, "sorted() takes exactly 1 argument")
            try:
                return sorted(args[0])
            except TypeError as e:
                raise ScriptError(node, str(e))
        elif func == "list":
            if len(args) == 0:
                return []
            if len(args) == 1:
                try:
                    return list(args[0])
                except TypeError as e:
                    raise ScriptError(node, str(e))
            raise ScriptError(node, "list() takes 0 or 1 arguments")
        elif func == "sum":
            if not args or len(args) > 2:
                raise ScriptError(node, "sum() takes 1 or 2 arguments")
            start = args[1] if len(args) == 2 else 0
            try:
                return sum(args[0], start)
            except TypeError as e:
                raise ScriptError(node, str(e))
        else:
            raise ScriptError(node, f"Unknown function: {func}")

        # add line info into the event
        if isinstance(ev, dict):
            ev["line"] = line_no
        return ev

    def _apply_binop(self, op, left, right, node):
        if isinstance(op, ast.Add): return left + right
        if isinstance(op, ast.Sub): return left - right
        if isinstance(op, ast.Mult): return left * right
        if isinstance(op, ast.Div):
            if right == 0:
                raise ScriptError(node, "Division by zero")
            return left / right
        if isinstance(op, ast.Mod):
            if right == 0:
                raise ScriptError(node, "Modulo by zero")
            return left % right
        if isinstance(op, ast.FloorDiv):
            if right == 0:
                raise ScriptError(node, "Division by zero")
            return left // right
        raise ScriptError(node, "Unsupported operator")

    def eval(self, node):
        if isinstance(node, ast.Constant):
            return node.value

        if isinstance(node, ast.Name):
            if node.id in self.ctx:
                return self.ctx[node.id]
            # Built-in constants
            if node.id == "True":
                return True
            if node.id == "False":
                return False
            if node.id == "None":
                return None
            raise ScriptError(node, f"Undefined variable: '{node.id}'")


        # Function calls in expressions (range, is_mature, get_weather, len, etc.)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            func_name = node.func.id
            if func_name == "range":
                args = [self.eval(a) for a in node.args]
                try:
                    return range(*args)
                except TypeError:
                    raise ScriptError(node, "Invalid range() arguments")
            if func_name == "len":
                args = [self.eval(a) for a in node.args]
                if len(args) != 1:
                    raise ScriptError(node, "len() takes exactly 1 argument")
                return len(args[0])
            if func_name == "str":
                args = [self.eval(a) for a in node.args]
                return str(args[0]) if args else ""
            if func_name == "int":
                args = [self.eval(a) for a in node.args]
                return int(args[0]) if args else 0
            if func_name == "float":
                args = [self.eval(a) for a in node.args]
                return float(args[0]) if args else 0.0
            if func_name == "bool":
                args = [self.eval(a) for a in node.args]
                return bool(args[0]) if args else False
            if func_name == "abs":
                args = [self.eval(a) for a in node.args]
                if len(args) != 1:
                    raise ScriptError(node, "abs() takes exactly 1 argument")
                return abs(args[0])
            if func_name == "max":
                args = [self.eval(a) for a in node.args]
                if not args:
                    raise ScriptError(node, "max() requires at least 1 argument")
                if len(args) == 1 and hasattr(args[0], '__iter__'):
                    return max(args[0])
                return max(*args)
            if func_name == "min":
                args = [self.eval(a) for a in node.args]
                if not args:
                    raise ScriptError(node, "min() requires at least 1 argument")
                if len(args) == 1 and hasattr(args[0], '__iter__'):
                    return min(args[0])
                return min(*args)
            if func_name == "round":
                args = [self.eval(a) for a in node.args]
                if len(args) == 1:
                    return round(args[0])
                elif len(args) == 2:
                    return round(args[0], args[1])
                else:
                    raise ScriptError(node, "round() takes 1 or 2 arguments")
            if func_name == "type":
                args = [self.eval(a) for a in node.args]
                if len(args) != 1:
                    raise ScriptError(node, "type() takes exactly 1 argument")
                t = type(args[0]).__name__
                return t
            if func_name == "enumerate":
                args = [self.eval(a) for a in node.args]
                if not args or len(args) > 2:
                    raise ScriptError(node, "enumerate() takes 1 or 2 arguments")
                start = args[1] if len(args) == 2 else 0
                return list(enumerate(args[0], start))
            if func_name == "sorted":
                args = [self.eval(a) for a in node.args]
                if len(args) != 1:
                    raise ScriptError(node, "sorted() takes exactly 1 argument")
                try:
                    return sorted(args[0])
                except TypeError as e:
                    raise ScriptError(node, str(e))
            if func_name == "list":
                args = [self.eval(a) for a in node.args]
                if len(args) == 0:
                    return []
                if len(args) == 1:
                    try:
                        return list(args[0])
                    except TypeError as e:
                        raise ScriptError(node, str(e))
                raise ScriptError(node, "list() takes 0 or 1 arguments")
            if func_name == "sum":
                args = [self.eval(a) for a in node.args]
                if not args or len(args) > 2:
                    raise ScriptError(node, "sum() takes 1 or 2 arguments")
                start = args[1] if len(args) == 2 else 0
                try:
                    return sum(args[0], start)
                except TypeError as e:
                    raise ScriptError(node, str(e))
            # Check user-defined functions in context
            if func_name in self.ctx and callable(self.ctx[func_name]):
                args = [self.eval(a) for a in node.args]
                self.called_functions.add(func_name)
                return self.ctx[func_name](*args)
            # Delegate to exec_call for farm functions
            return self.exec_call(node)

        # Method calls on objects: obj.method(args)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
            obj = self.eval(node.func.value)
            method_name = node.func.attr
            args = [self.eval(a) for a in node.args]
            SAFE_METHODS = {
                'keys', 'values', 'items', 'get',
                'upper', 'lower', 'strip', 'split', 'join', 'replace',
                'startswith', 'endswith', 'count', 'index',
                'append', 'pop', 'sort', 'reverse', 'copy',
            }
            if method_name in SAFE_METHODS:
                method = getattr(obj, method_name, None)
                if method and callable(method):
                    return method(*args)
            raise ScriptError(node, f"Unsupported method: {method_name}")

        if isinstance(node, ast.Call):
            return self.exec_call(node)

        # Binary operations: +, -, *, /, %, //
        if isinstance(node, ast.BinOp):
            left = self.eval(node.left)
            right = self.eval(node.right)
            return self._apply_binop(node.op, left, right, node)

        # Unary operations: not, -, +
        if isinstance(node, ast.UnaryOp):
            operand = self.eval(node.operand)
            if isinstance(node.op, ast.Not):
                return not operand
            if isinstance(node.op, ast.USub):
                return -operand
            if isinstance(node.op, ast.UAdd):
                return +operand
            raise ScriptError(node, "Unsupported unary operator")

        # Comparison operators
        if isinstance(node, ast.Compare):
            left = self.eval(node.left)
            # Support chained comparisons
            for op, comparator in zip(node.ops, node.comparators):
                right = self.eval(comparator)
                if isinstance(op, ast.Gt):
                    result = left > right
                elif isinstance(op, ast.Lt):
                    result = left < right
                elif isinstance(op, ast.Eq):
                    result = left == right
                elif isinstance(op, ast.GtE):
                    result = left >= right
                elif isinstance(op, ast.LtE):
                    result = left <= right
                elif isinstance(op, ast.NotEq):
                    result = left != right
                elif isinstance(op, ast.In):
                    result = left in right
                elif isinstance(op, ast.NotIn):
                    result = left not in right
                else:
                    raise ScriptError(node, "Unsupported comparison")
                if not result:
                    return False
                left = right
            return True

        # Boolean operators: and, or
        if isinstance(node, ast.BoolOp):
            if isinstance(node.op, ast.And):
                result = True
                for value in node.values:
                    result = self.eval(value)
                    if not result:
                        return result
                return result
            if isinstance(node.op, ast.Or):
                result = False
                for value in node.values:
                    result = self.eval(value)
                    if result:
                        return result
                return result
            raise ScriptError(node, "Unsupported boolean operator")

        # List literals
        if isinstance(node, ast.List):
            return [self.eval(elt) for elt in node.elts]

        # Tuple literals
        if isinstance(node, ast.Tuple):
            return tuple(self.eval(elt) for elt in node.elts)

        # f-strings (JoinedStr)
        if isinstance(node, ast.JoinedStr):
            parts = []
            for value in node.values:
                if isinstance(value, ast.Constant):
                    parts.append(str(value.value))
                elif isinstance(value, ast.FormattedValue):
                    parts.append(str(self.eval(value.value)))
                else:
                    parts.append(str(self.eval(value)))
            return "".join(parts)

        # Subscript (indexing and slicing): e.g. my_list[0], my_list[1:3]
        if isinstance(node, ast.Subscript):
            obj = self.eval(node.value)
            slc = node.slice
            # Handle slice syntax: obj[start:stop] or obj[start:stop:step]
            if isinstance(slc, ast.Slice):
                lower = self.eval(slc.lower) if slc.lower else None
                upper = self.eval(slc.upper) if slc.upper else None
                step = self.eval(slc.step) if slc.step else None
                try:
                    return obj[lower:upper:step]
                except (IndexError, TypeError) as e:
                    raise ScriptError(node, str(e))
            idx = self.eval(slc)
            try:
                return obj[idx]
            except (IndexError, KeyError, TypeError) as e:
                raise ScriptError(node, str(e))

        # Dict literals
        if isinstance(node, ast.Dict):
            keys = [self.eval(k) for k in node.keys]
            values = [self.eval(v) for v in node.values]
            return dict(zip(keys, values))

        # Attribute access: e.g. obj.attr
        if isinstance(node, ast.Attribute):
            obj = self.eval(node.value)
            attr = node.attr
            result = getattr(obj, attr, None)
            if result is not None:
                return result
            raise ScriptError(node, f"No attribute '{attr}'")

        raise ScriptError(node, f"Unsupported expression: {type(node)}")
