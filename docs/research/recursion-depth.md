# Non-tail custom-function recursion depth

## Result

Non-tail custom-function recursion remains limited by the Node.js JavaScript stack. In the generated `Sum1 ( n ) = If ( n <= 0 ; 0 ; n + Sum1 ( n - 1 ) )` calculation, 500 levels pass and 5,000 levels return `?`. A non-tail runaway on this run reports `Forever recursed too deeply (this server's stack ran out at level 714; FileMaker allows 10000)`. The exact level depends on the Node build and the surrounding call path.

Tail calls through `If`, `Case` and `Let` already use an explicit loop. Existing coverage confirms a tail-recursive sum at 9,990 calls and checks the 10,000-call runaway guard. The measured depth for non-tail recursion is recorded in [numbers and precision](../numbers-and-precision.md).

## Blocker

The remaining recursion happens while evaluating an enclosing expression. For each call, `Env.v()` enters `traced()` and `node()`, then arithmetic evaluation calls `Env.v()` for its operands. A general stack-safe implementation therefore needs an explicit evaluation/continuation stack for the expression tree, not only a loop around `customFunction()`.

That evaluator must retain current behaviour for every node kind, short-circuit operators, `Let` scope creation and binding order, field-name provenance, custom-function scope isolation, argument evaluation, decimal precision, callback-backed built-ins and plug-ins, error propagation, work budgets, and per-node tracing. Evaluation contexts used by the store and server supply callbacks and state, so moving only the calculation to a worker cannot transfer the live context; Node's process-wide `--stack-size` is also not an option for a library used inside those hosts. Implementing and validating this without changing ordinary formula results is a broader evaluator rewrite, beyond the few-hundred-line bound for this item.

## Evidence

Generated synthetic probes for deep sums, mutual recursion, a `Let` around a non-tail call, and a non-tail runaway were used to confirm this blocker. The probes were not retained as failing tests because this item stops at the documented implementation blocker. The existing test suite still covers the 500-level non-tail case and deep tail recursion. No FileMaker runtime was available for a compatibility comparison.
