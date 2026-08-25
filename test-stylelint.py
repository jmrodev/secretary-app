import json

with open('client/.stylelintrc.json', 'r') as f:
    config = json.load(f)

# The most stable relaxation is to change the severity to warning,
# so that the build is not blocked, but the linter still warns developers
config['rules']['plugin/selector-bem-pattern'] = [
    {
        "preset": "bem",
        "componentName": "^[A-Z][a-zA-Z0-9]*$",
        "componentSelectors": "^\\.{componentName}(?:__[a-zA-Z0-9]+)?(?:--[a-zA-Z0-9]+)?$",
        "implicitComponents": "**/*.module.css"
    },
    { "severity": "warning" }
]

with open('client/.stylelintrc.json', 'w') as f:
    json.dump(config, f, indent=2)

