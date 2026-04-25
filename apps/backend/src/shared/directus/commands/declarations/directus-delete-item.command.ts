export class DirectusDeleteItemCommand {
  constructor(
    public readonly collection: string,
    public readonly id: string,
  ) {}
}
