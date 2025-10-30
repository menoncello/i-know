export interface Actor {
  id: string;
  name: string;
  imdbId?: string;
  imageUrl?: string;
}

export interface Content {
  id: string;
  type: 'movie' | 'tv' | 'documentary';
  title: string;
  year?: number;
  posterUrl?: string;
}
