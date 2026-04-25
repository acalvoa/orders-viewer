export class DirectusBulkUpdateCommand {
  constructor(
    public readonly collection: string,
    public readonly items: Array<Record<string, unknown>>,
  ) {}
}
