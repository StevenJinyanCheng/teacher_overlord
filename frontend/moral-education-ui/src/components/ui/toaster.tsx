"use client";

import { 
  createToaster, 
  Toast, 
  ToasterProps as ChakraToasterProps 
} from "@chakra-ui/react";
import { ReactNode } from "react";

export interface ToasterProps extends ChakraToasterProps {
  children?: ReactNode;
}

export const toaster = createToaster({
  placement: "top-end",
  duration: 3000,
});

export function Toaster(props: ToasterProps) {
  return (
    <Toast.Provider>
      <Toast.Viewport {...props} />
    </Toast.Provider>
  );
}
