import axiosConfig from "./axiosConfig.jsx";
import {API_ENDPOINTS} from "./apiEndpoints.js";

const uploadProfileImage = async (image) => {
    const formData = new FormData();
    formData.append("file", image);

    try {
        const response = await axiosConfig.post(API_ENDPOINTS.UPLOAD_IMAGE, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        console.log('Image uploaded successfully.', response.data);
        return response.data.secure_url;
    } catch (error) {
        console.error("Error uploading the image", error);
        throw error;
    }
}

export default uploadProfileImage;
