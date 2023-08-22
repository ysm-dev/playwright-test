import { atom as renderAtom } from './atom'
import { Author, Extension, FeedOptions, Item } from './typings'

/**
 * Class used to generate Feeds
 */
export class Feed {
  options: FeedOptions
  items: Item[] = []
  categories: string[] = []
  contributors: Author[] = []
  extensions: Extension[] = []

  constructor(options: FeedOptions) {
    this.options = options
  }

  /**
   * Add a feed item
   * @param item
   */
  public addItem = (item: Item) => this.items.push(item)

  /**
   * Add a category
   * @param category
   */
  public addCategory = (category: string) => this.categories.push(category)

  /**
   * Add a contributor
   * @param contributor
   */
  public addContributor = (contributor: Author) =>
    this.contributors.push(contributor)

  /**
   * Adds an extension
   * @param extension
   */
  public addExtension = (extension: Extension) =>
    this.extensions.push(extension)

  /**
   * Returns a Atom 1.0 feed
   */
  public atom = (): string => renderAtom(this)
}
