export class DirectusGetItemQuery {
  constructor(
    public readonly collection: string,
    public readonly id: string,
    public readonly fields?: string[],
  ) {}
}
