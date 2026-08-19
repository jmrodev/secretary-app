import type { ReactDoctorConfig } from "react-doctor/api";

export default {
  rules: {
    "react-doctor/no-render-in-render": "error",
    "react-doctor/no-derived-state-effect": "error",
    "react-doctor/no-cascading-set-state": "error",
    "react-doctor/no-complex-memo": "warn",
    "react-doctor/no-array-index-as-key": "error",
    "react-doctor/heavy-library-import": "warn",
    "react-doctor/no-multi-comp": "off",
    "react-doctor/prefer-html-dialog": "off",
    "react-doctor/prefer-use-effect-event": "off",
    "react-doctor/dangerous-html-sink": "off",
    "react-doctor/prefer-useReducer": "off",
    "react-doctor/no-pass-live-state-to-parent": "off"
  },
  ignore: {
    tags: ["design"],

    rules: [
      "react-doctor/no-many-boolean-props",
      "react-doctor/no-giant-component",
      "react-doctor/no-generic-handler-names",
      "react-doctor/no-unused-export",
      "react-doctor/no-unused-file"
    ]
  }
} satisfies ReactDoctorConfig;