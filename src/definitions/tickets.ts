export class tickets {
  _id: string = "";
  image: string = "";
  title: string = "";
  description: string = "";
  points: number = 500;
  quantity: number = 0;
  available: boolean = true;
  category_id: string = "";
  order: number = 0;
  business_id: string = "";
  issued: number = 0
  value: number = 0;
  business: Business = null;
}

export class Business {
  _id: string = "";
  title: string = "";
  description: string = "";
  image: string = "";
  url: string = "";
}
