import PropertyList from "@/components/dashboard/properties-list";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
   title: "FCITY.ai — Dashboard Property List",
};
const index = () => {
   return (
      <Wrapper>
         <PropertyList />
      </Wrapper>
   )
}

export default index