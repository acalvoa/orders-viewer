export class DirectusUpdateItemCommand {
  constructor(
    public readonly collection: string,
    public readonly id: string,
    public readonly body: Record<string, unknown>,
  ) {}
}
