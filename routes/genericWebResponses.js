import express from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export default function genericResponse(status, message, output) {
    try {
        return {
            "Result_Status": status,
            "Result_Message": message,
            "Result_Output": output,
        }
    } catch (error) {
        console.log("Error in genericResponse==", error);
    }
};