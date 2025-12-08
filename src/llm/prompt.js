export const MIGRATION_PROMPT = `
Convert the following React class component into a JSON migration plan.

Return ONLY valid JSON:
{
  "name": "string",
  "state": {},
  "methods": {},
  "lifecycle": {
    "componentDidMount": null,
    "componentDidUpdate": null,
    "componentWillUnmount": null
  },
  "usesProps": boolean,
  "jsx": "<raw jsx>"
}
`;
