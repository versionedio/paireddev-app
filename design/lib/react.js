// The only file that knows which view library is in use.
// Porting to React: replace this file's body with re-exports from 'react' and
// swap the `html` tagged templates for JSX. Hook names and semantics match.
export {
  h, html, render, Component, createContext,
  useState, useReducer, useEffect, useLayoutEffect, useRef, useMemo, useCallback, useContext,
} from 'https://cdn.jsdelivr.net/npm/htm@3.1.1/preact/standalone.module.js';
