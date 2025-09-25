// START OF FILE src/shims-react.d.ts
// Este archivo le dice a TypeScript cómo manejar la importación de archivos .jsx.
// Sin esto, TypeScript podría no reconocer los tipos exportados de los archivos .jsx,
// lo que resultaría en errores de tipo 'implicitly has an any type'.

declare module '*.jsx' {
  import React from 'react';
  const content: React.ComponentType<any>;
  export default content;
}
// END OF FILE src/shims-react.d.ts