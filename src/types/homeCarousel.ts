export interface HomeCarouselCard {
  id: string;
  position: number;
  eyebrow: string;
  title: string;
  image_url: string | null;
  link_to: string | null;
  active: boolean;
  created_at: string;
}
