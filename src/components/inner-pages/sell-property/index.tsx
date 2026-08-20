import FooterOne from "@/layouts/footers/FooterOne"
import HeaderTwo from "@/layouts/headers/HeaderTwo"
import SellPropertyArea from "./SellPropertyArea"

const SellProperty = () => {
   return (
      <>
         <HeaderTwo style_1={false} style_2={false} />
         <SellPropertyArea />
         <FooterOne style={true} />
      </>
   )
}

export default SellProperty
