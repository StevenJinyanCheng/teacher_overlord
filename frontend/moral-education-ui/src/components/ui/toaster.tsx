"use client";

import {
  createToaster,
  Toaster as ChakraUIRenderToasterComponent // Import the Toaster component from Chakra UI
} from "@chakra-ui/react";

// Create the toast instance with default configurations.
// This instance will be used to trigger toasts (e.g., toaster.success('Message')).
export const toaster = createToaster({
  placement: "top-end",
  duration: 3000,
});

// Export the Toaster component from Chakra UI.
// This component needs to be rendered once in your application's layout
// to display the toasts created by the `toaster` instance.
export const Toaster = ChakraUIRenderToasterComponent;
