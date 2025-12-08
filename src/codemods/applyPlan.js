// export const parser = "babel";

// import fs from "fs";

// export default function transformer(file, api) {
//   const j = api.jscodeshift;
//   const root = j(file.source);

//   if (!fs.existsSync("plan.json")) return file.source;
//   const plan = JSON.parse(fs.readFileSync("plan.json", "utf8"));

//   const cls = root.find(j.ClassDeclaration, { id: { name: plan.name } });
//   if (cls.size() === 0) return file.source;

//   // NEW FUNCTION COMPONENT
//   const func = j.functionDeclaration(
//     j.identifier(plan.name),
//     plan.usesProps ? [j.identifier("props")] : [],
//     j.blockStatement([]), // <-- ALWAYS a valid empty block
//   );

//   const body = func.body.body;

//   //------------------------------------------------------------------
//   // 1. CREATE STATE HOOKS
//   //------------------------------------------------------------------
//   for (const [key, val] of Object.entries(plan.state || {})) {
//     const setter = "set" + key.charAt(0).toUpperCase() + key.slice(1);

//     body.push(
//       j.variableDeclaration("const", [
//         j.variableDeclarator(
//           j.arrayPattern([j.identifier(key), j.identifier(setter)]),
//           j.callExpression(
//             j.memberExpression(j.identifier("React"), j.identifier("useState")),
//             [safeLiteral(j, val)],
//           ),
//         ),
//       ]),
//     );
//   }

//   //------------------------------------------------------------------
//   // 2. LIFECYCLE → useEffect
//   //------------------------------------------------------------------
//   if (plan.lifecycle?.componentDidMount) {
//     const didMountBody = safeBlockFromString(
//       j,
//       plan.lifecycle.componentDidMount,
//     );

//     body.push(
//       j.expressionStatement(
//         j.callExpression(
//           j.memberExpression(j.identifier("React"), j.identifier("useEffect")),
//           [
//             j.arrowFunctionExpression([], didMountBody),
//             j.arrayExpression([]), // []
//           ],
//         ),
//       ),
//     );
//   }

//   //------------------------------------------------------------------
//   // 3. METHODS
//   //------------------------------------------------------------------
//   for (const [name, code] of Object.entries(plan.methods || {})) {
//     const methodBlock = safeBlockFromString(j, code);

//     body.push(
//       j.variableDeclaration("const", [
//         j.variableDeclarator(
//           j.identifier(name),
//           j.arrowFunctionExpression([], methodBlock),
//         ),
//       ]),
//     );
//   }

//   //------------------------------------------------------------------
//   // 4. RENDER (JSX)
//   //------------------------------------------------------------------
//   if (plan.jsx) {
//     const jsx = j.template.expression([plan.jsx]);
//     const cleaned = cleanJSX(j, jsx, plan.usesProps);

//     body.push(j.returnStatement(cleaned));
//   }

//   //------------------------------------------------------------------
//   cls.replaceWith(func);
//   return root.toSource();
// }

// // -----------------------------------------------------------
// // HELPERS
// // -----------------------------------------------------------

// function safeLiteral(j, value) {
//   if (
//     value === null ||
//     typeof value === "string" ||
//     typeof value === "number" ||
//     typeof value === "boolean"
//   ) {
//     return j.literal(value);
//   }
//   return j.literal(null);
// }

// // Convert raw string into a block safely
// function safeBlockFromString(j, code) {
//   if (!code || typeof code !== "string" || !code.trim()) {
//     return j.blockStatement([]); // NEVER return undefined
//   }

//   try {
//     // j.template.statement creates: { type: "ExpressionStatement" }
//     const stmt = j.template.statement([code]);
//     return j.blockStatement(Array.isArray(stmt.body) ? stmt.body : [stmt]);
//   } catch (err) {
//     // fallback on simple expression
//     return j.blockStatement([]);
//   }
// }

// function cleanJSX(j, jsx, usesProps) {
//   j(jsx)
//     .find(j.MemberExpression)
//     .forEach((p) => {
//       const n = p.node;

//       // this.state.x → x
//       if (
//         n.object?.type === "MemberExpression" &&
//         n.object.object?.type === "ThisExpression" &&
//         n.object.property?.name === "state"
//       ) {
//         p.replace(j.identifier(n.property.name));
//         return;
//       }

//       // this.props.x → props.x
//       if (
//         usesProps &&
//         n.object?.type === "MemberExpression" &&
//         n.object.object?.type === "ThisExpression" &&
//         n.object.property?.name === "props"
//       ) {
//         p.replace(j.memberExpression(j.identifier("props"), n.property));
//         return;
//       }

//       // this.x → x
//       if (n.object?.type === "ThisExpression") {
//         p.replace(j.identifier(n.property.name));
//       }
//     });

//   return jsx;
// }

export const parser = "babel";

import fs from "fs";

export default function transformer(file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const planFile = options.planPath;
  if (!planFile || !fs.existsSync(planFile)) {
    console.warn(`⚠️ Plan file missing for ${file.path}:`, planFile);
    return file.source;
  }

  const plan = JSON.parse(fs.readFileSync(planFile, "utf8"));

  const cls = root.find(j.ClassDeclaration, { id: { name: plan.name } });
  if (cls.size() === 0) return file.source;

  const func = j.functionDeclaration(
    j.identifier(plan.name),
    plan.usesProps ? [j.identifier("props")] : [],
    j.blockStatement([]),
  );

  const body = func.body.body;

  // state → useState
  for (const [key, val] of Object.entries(plan.state || {})) {
    const setter = "set" + key.charAt(0).toUpperCase() + key.slice(1);

    body.push(
      j.variableDeclaration("const", [
        j.variableDeclarator(
          j.arrayPattern([j.identifier(key), j.identifier(setter)]),
          j.callExpression(
            j.memberExpression(j.identifier("React"), j.identifier("useState")),
            [safeLiteral(j, val)],
          ),
        ),
      ]),
    );
  }

  // lifecycle: componentDidMount
  if (plan.lifecycle?.componentDidMount) {
    const blk = safeBlockFromString(j, plan.lifecycle.componentDidMount);
    body.push(
      j.expressionStatement(
        j.callExpression(
          j.memberExpression(j.identifier("React"), j.identifier("useEffect")),
          [j.arrowFunctionExpression([], blk), j.arrayExpression([])],
        ),
      ),
    );
  }

  // lifecycle: componentWillUnmount
  if (plan.lifecycle?.componentWillUnmount) {
    const blk = safeBlockFromString(j, plan.lifecycle.componentWillUnmount);
    const cleanup = j.blockStatement([
      j.returnStatement(j.arrowFunctionExpression([], blk)),
    ]);

    body.push(
      j.expressionStatement(
        j.callExpression(
          j.memberExpression(j.identifier("React"), j.identifier("useEffect")),
          [j.arrowFunctionExpression([], cleanup), j.arrayExpression([])],
        ),
      ),
    );
  }

  // methods
  for (const [name, code] of Object.entries(plan.methods || {})) {
    const blk = safeBlockFromString(j, code);

    body.push(
      j.variableDeclaration("const", [
        j.variableDeclarator(
          j.identifier(name),
          j.arrowFunctionExpression([], blk),
        ),
      ]),
    );
  }

  // render → return JSX
  if (plan.jsx) {
    const jsxNode = j.template.expression([plan.jsx]);
    const cleaned = cleanJSX(j, jsxNode, plan.usesProps);
    body.push(j.returnStatement(cleaned));
  }

  cls.replaceWith(func);

  return root.toSource({ quote: "single" });
}

function safeLiteral(j, val) {
  if (
    val === null ||
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean"
  ) {
    return j.literal(val);
  }
  return j.literal(null);
}

function safeBlockFromString(j, code) {
  if (!code || typeof code !== "string" || !code.trim()) {
    return j.blockStatement([]);
  }

  try {
    const stmt = j.template.statement([code]);

    if (stmt.type === "BlockStatement") return stmt;
    if (stmt.type === "ExpressionStatement") return j.blockStatement([stmt]);

    return j.blockStatement([]);
  } catch {
    return j.blockStatement([]);
  }
}

function cleanJSX(j, jsx, usesProps) {
  j(jsx)
    .find(j.MemberExpression)
    .forEach((p) => {
      const n = p.node;

      // this.state.x → x
      if (
        n.object?.type === "MemberExpression" &&
        n.object.object?.type === "ThisExpression" &&
        n.object.property?.name === "state"
      ) {
        p.replace(j.identifier(n.property.name));
        return;
      }

      // this.props.x → props.x
      if (
        usesProps &&
        n.object?.type === "MemberExpression" &&
        n.object.object?.type === "ThisExpression" &&
        n.object.property?.name === "props"
      ) {
        p.replace(j.memberExpression(j.identifier("props"), n.property));
        return;
      }

      // this.x → x
      if (n.object?.type === "ThisExpression") {
        p.replace(j.identifier(n.property.name));
      }
    });

  return jsx;
}
