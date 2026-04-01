export class TemplateDslError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateDslError';
  }
}
