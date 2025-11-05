// ai-service/tools/escalate_to_advanced_model.js

export function getEscalateToAdvancedModelTool(t) {
  return {
    type: 'function',
    function: {
      name: 'escalate_to_advanced_model',
      description: t.description,
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: t.parameters.reason,
          },
          user_request: {
              type: 'string',
              description: t.parameters.user_request
          }
        },
        required: ['reason', 'user_request'],
      },
    },
  };
}