export class DirectusCreateItemCommand {
  constructor(
    public readonly collection: string,
    public readonly body: Record<string, unknown>,
  ) {}
}
