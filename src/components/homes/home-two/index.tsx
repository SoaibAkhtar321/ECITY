import FooterOne from "@/layouts/footers/FooterOne"
import HeroBanner from "./HeroBanner"
import FeedbackOne from "./FeedbackOne"
import Property from "./Property"
import BLockFeatureOne from "./BLockFeatureOne"
import FancyBannerOne from "./FancyBannerOne"
import BLockFeatureTwo from "./BLockFeatureTwo"
import FeedbackTwo from "./FeedbackTwo"
import Blog from "./Blog"
import FAQ from "./FAQ"
import FancyBannerTwo from "./FancyBannerTwo"
import HeaderTwo from "@/layouts/headers/HeaderTwo"
import FcityHowItWorks from "./FcityHowItWorks"
import FcityMapIntelligence from "./FcityMapIntelligence"
import FcityAIAdvisor from "./FcityAIAdvisor"

const HomeTwo = () => {
  return (
    <>
      <HeaderTwo style_1={false} style_2={false} />
      <HeroBanner />
      <FeedbackOne />
      <Property />
      <FcityHowItWorks />
      <BLockFeatureOne />
      <FancyBannerOne />
      <FcityMapIntelligence />
      <FcityAIAdvisor />
      <BLockFeatureTwo />
      <FeedbackTwo />
      <Blog style={false} />
      <FAQ />
      <FancyBannerTwo/>
      <FooterOne style={true} />
    </>
  )
}

export default HomeTwo
