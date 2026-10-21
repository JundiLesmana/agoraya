export type IntegrationMapper<TInput, TOutput> = (input: TInput) => TOutput;

export function mapIntegrationData<TInput, TOutput>(input: TInput, mapper: IntegrationMapper<TInput, TOutput>): TOutput {
  return mapper(input);
}

