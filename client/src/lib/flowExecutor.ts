import { NodeDefinition } from '../types/flow';

export interface ExecutionContext {
  variables: Record<string, any>;
  currentNode: string;
  userPhone: string;
  flowId: string;
}

export class FlowExecutor {
  private nodes: Map<string, NodeDefinition>;
  private context: ExecutionContext;

  constructor(nodes: NodeDefinition[], context: ExecutionContext) {
    this.nodes = new Map(nodes.map(node => [node.id, node]));
    this.context = context;
  }

  interpolateVariables(text: string): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, varPath) => {
      const keys = varPath.trim().split('.');
      let value: any = this.context.variables;

      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return match;
        }
      }

      return String(value ?? match);
    });
  }

  async executeNode(nodeId: string): Promise<{
    success: boolean;
    nextNode?: string;
    response?: any;
    error?: string;
  }> {
    const node = this.nodes.get(nodeId);

    if (!node) {
      return { success: false, error: 'Node not found' };
    }

    this.context.currentNode = nodeId;

    try {
      switch (node.type) {
        case 'message':
          return this.executeMessage(node);

        case 'button_message':
          return this.executeButtonMessage(node);

        case 'send_button':
          return this.executeSendButton(node);

        case 'list_message':
          return this.executeListMessage(node);

        case 'template':
          return this.executeTemplate(node);

        case 'cta_url':
          return this.executeCTAUrl(node);

        case 'form':
          return this.executeForm(node);

        case 'capture_response':
          return this.executeCaptureResponse(node);

        case 'webhook':
          return this.executeWebhook(node);

        case 'conditional':
          return this.executeConditional(node);

        case 'api':
          return this.executeAPI(node);

        case 'delay':
          return this.executeDelay(node);

        case 'end':
          return this.executeEnd(node);

        case 'button_1_branch':
        case 'button_2_branch':
        case 'button_3_branch':
        case 'button_4_branch':
          return this.executeButtonBranch(node);

        default:
          return { success: false, error: 'Unknown node type' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution error'
      };
    }
  }

  private executeMessage(node: NodeDefinition) {
    const { content, next } = node.data.config;
    const interpolatedContent = this.interpolateVariables(content);

    return {
      success: true,
      response: { type: 'text', content: interpolatedContent },
      nextNode: next
    };
  }

  private executeButtonMessage(node: NodeDefinition) {
    const { content, buttons } = node.data.config;
    const interpolatedContent = this.interpolateVariables(content);

    return {
      success: true,
      response: {
        type: 'button',
        content: interpolatedContent,
        buttons: buttons.map((btn: any) => ({
          id: btn.id,
          text: this.interpolateVariables(btn.text)
        }))
      }
    };
  }

  private executeSendButton(node: NodeDefinition) {
    const {
      headerType,
      headerText,
      headerMediaUrl,
      bodyText,
      footerText,
      buttons,
      buttonBranches
    } = node.data.config;

    const interpolatedBodyText = this.interpolateVariables(bodyText);
    const interpolatedFooterText = footerText ? this.interpolateVariables(footerText) : '';

    let header: any = {};
    if (headerType === 'text') {
      header = {
        type: 'text',
        text: this.interpolateVariables(headerText || '')
      };
    } else if (['image', 'video', 'document', 'audio'].includes(headerType)) {
      header = {
        type: headerType,
        [headerType]: {
          link: this.interpolateVariables(headerMediaUrl || '')
        }
      };
    }

    return {
      success: true,
      response: {
        type: 'interactive',
        interactive: {
          type: 'button',
          header,
          body: {
            text: interpolatedBodyText
          },
          footer: footerText ? {
            text: interpolatedFooterText
          } : undefined,
          action: {
            buttons: buttons.map((btn: any) => ({
              type: 'reply',
              reply: {
                id: btn.id,
                title: btn.title
              }
            }))
          }
        },
        buttonBranches
      }
    };
  }

  private executeListMessage(node: NodeDefinition) {
    const { content, button_text, sections } = node.data.config;

    return {
      success: true,
      response: {
        type: 'list',
        content: this.interpolateVariables(content),
        button_text,
        sections
      }
    };
  }

  private executeTemplate(node: NodeDefinition) {
    const { template_name, language, parameters, next } = node.data.config;
    const interpolatedParams = parameters.map((p: string) => this.interpolateVariables(p));

    return {
      success: true,
      response: {
        type: 'template',
        template_name,
        language,
        parameters: interpolatedParams
      },
      nextNode: next
    };
  }

  private executeCTAUrl(node: NodeDefinition) {
    const { content, button_text, url, next } = node.data.config;

    return {
      success: true,
      response: {
        type: 'cta_url',
        content: this.interpolateVariables(content),
        button_text,
        url: this.interpolateVariables(url)
      },
      nextNode: next
    };
  }

  private executeForm(node: NodeDefinition) {
    const { fields, save_as: _save_as, next } = node.data.config;

    return {
      success: true,
      response: {
        type: 'form',
        fields
      },
      nextNode: next
    };
  }

  private executeCaptureResponse(node: NodeDefinition) {
    const { prompt, response_type, save_as, next } = node.data.config;

    return {
      success: true,
      response: {
        type: 'capture',
        prompt: this.interpolateVariables(prompt),
        response_type,
        save_as
      },
      nextNode: next
    };
  }

  private async executeWebhook(node: NodeDefinition) {
    const { url, method, headers, body, save_as, next } = node.data.config;

    try {
      const interpolatedUrl = this.interpolateVariables(url);
      const interpolatedBody = JSON.parse(this.interpolateVariables(JSON.stringify(body)));

      const response = await fetch(interpolatedUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: method !== 'GET' ? JSON.stringify(interpolatedBody) : undefined
      });

      const data = await response.json();

      if (save_as) {
        this.context.variables[save_as] = data;
      }

      return {
        success: true,
        response: data,
        nextNode: next
      };
    } catch (error) {
      return {
        success: false,
        error: 'Webhook execution failed'
      };
    }
  }

  private executeConditional(node: NodeDefinition) {
    const { conditions, default_next } = node.data.config;

    for (const condition of conditions) {
      const { variable, operator, value, next } = condition;
      const varValue = this.context.variables[variable];

      let conditionMet = false;

      switch (operator) {
        case '==':
          conditionMet = varValue == value;
          break;
        case '!=':
          conditionMet = varValue != value;
          break;
        case '>':
          conditionMet = varValue > value;
          break;
        case '<':
          conditionMet = varValue < value;
          break;
        case '>=':
          conditionMet = varValue >= value;
          break;
        case '<=':
          conditionMet = varValue <= value;
          break;
        case 'contains':
          conditionMet = String(varValue).includes(String(value));
          break;
      }

      if (conditionMet) {
        return {
          success: true,
          nextNode: next
        };
      }
    }

    return {
      success: true,
      nextNode: default_next
    };
  }

  private async executeAPI(node: NodeDefinition) {
    const { url, method, headers, body, save_as, next } = node.data.config;

    try {
      const interpolatedUrl = this.interpolateVariables(url);

      const response = await fetch(interpolatedUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: method !== 'GET' ? JSON.stringify(body) : undefined
      });

      const data = await response.json();

      if (save_as) {
        this.context.variables[save_as] = data;
      }

      return {
        success: true,
        response: data,
        nextNode: next
      };
    } catch (error) {
      return {
        success: false,
        error: 'API call failed'
      };
    }
  }

  private async executeDelay(node: NodeDefinition) {
    const { duration, unit, next } = node.data.config;

    const multipliers: Record<string, number> = {
      seconds: 1000,
      minutes: 60000,
      hours: 3600000,
      days: 86400000
    };

    const delayMs = duration * (multipliers[unit] || 1000);

    await new Promise(resolve => setTimeout(resolve, delayMs));

    return {
      success: true,
      nextNode: next
    };
  }

  private executeEnd(node: NodeDefinition) {
    const { message } = node.data.config;

    return {
      success: true,
      response: {
        type: 'text',
        content: this.interpolateVariables(message)
      }
    };
  }

  private executeButtonBranch(node: NodeDefinition) {
    const { content, next, buttonNumber } = node.data.config;
    const interpolatedContent = this.interpolateVariables(content);

    return {
      success: true,
      response: {
        type: 'text',
        content: interpolatedContent,
        buttonNumber
      },
      nextNode: next
    };
  }

  async run(startNodeId: string): Promise<void> {
    let currentNodeId: string | undefined = startNodeId;

    while (currentNodeId) {
      const result = await this.executeNode(currentNodeId);

      if (!result.success) {
        console.error('Execution error:', result.error);
        break;
      }

      currentNodeId = result.nextNode;

      if (!currentNodeId) {
        break;
      }
    }
  }
}
