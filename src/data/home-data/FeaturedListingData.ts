interface DataType {
   id: number;
   page: string;
   tag: string;
   title: string;
   address: string;
   data_delay_time?: string;
   item_bg_img:string;
   property_info: {
      feature: string;
      total_feature: number;
   }[];
}[];

const feature_listing_data:DataType[]=[
   {
      id: 1,
      page: "home_5",
      tag: "Rent",
      item_bg_img:"item-bg-1",
      title: "Gated Villa, Shamshabad",
      address: "Shamshabad, Hyderabad",
      property_info: [{feature: "sqft", total_feature: 2137 }, {feature: "bed", total_feature: 0o3 }, {feature: "kitchen", total_feature: 0o1 }, {feature: "bath", total_feature: 0o2 },],
   },
   {
      id: 2,
      page: "home_5",
      tag: "Sell",
      item_bg_img:"item-bg-2",
      title: "Future City Premium Plot",
      address: "Mucherla, Hyderabad",
      data_delay_time:"0.1s",
      property_info: [{feature: "sqft", total_feature: 2400 }, {feature: "facing", total_feature: 0o1 }, {feature: "road ft", total_feature: 33 },],
   },
   {
      id: 3,
      page: "home_5",
      tag: "Rent",
      item_bg_img:"item-bg-3",
      title: "Modern Apartment, Kollur",
      address: "Kollur, Hyderabad",
      data_delay_time:"0.2s",
      property_info: [{feature: "sqft", total_feature: 1850 }, {feature: "bed", total_feature: 0o3 }, {feature: "kitchen", total_feature: 0o1 }, {feature: "bath", total_feature: 0o2 },],
   },
]

export default feature_listing_data;