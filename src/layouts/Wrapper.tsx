"use client";

import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { animationCreate } from "@/utils/utils";
import ScrollToTop from "@/components/common/ScrollToTop";
import FcityAIWidget from "@/components/common/FcityAIWidget";

if (typeof window !== "undefined") {
    require("bootstrap/dist/js/bootstrap");
}

const Wrapper = ({ children }: any) => {
    useEffect(() => {
        // animation
        const timer = setTimeout(() => {
            animationCreate();
        }, 100);

        return () => clearTimeout(timer);
    }, []);


    return <>
        {children}
        <ScrollToTop />
        <FcityAIWidget />
        <ToastContainer position="top-center" />
    </>;
}

export default Wrapper
