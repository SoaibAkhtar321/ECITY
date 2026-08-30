import ServiceOne from "@/components/inner-pages/services/service-one";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
   title: "FCITY.ai — Service One",
};
const index = () => {
   return (
      <Wrapper>
         <ServiceOne />
      </Wrapper>
   )
}

export default index