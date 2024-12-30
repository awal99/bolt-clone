import { createAnthropic } from '@ai-sdk/anthropic';
import { bedrock } from '@ai-sdk/amazon-bedrock';

export function getAnthropicModel(apiKey: string) {
  const anthropic = createAnthropic({
    apiKey,
  });

  return anthropic('claude-3-5-sonnet-20240620');
}

//create custom model to be used with bolt.new. 
//setup llama3.1 on amazon.bedrock. Use the bedrock model for connection
export function getLlamaModel(){
  return bedrock('meta.llama3-3-70b-instruct-v1:0')
}

//setup claude bedrock
export function getClaudeBedrock(){
  return bedrock('us.anthropic.claude-3-5-sonnet-20240620-v1:0')
}