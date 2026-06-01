import {useContext, useEffect, useRef} from "react";
import {AppContext} from "../context/AppContext.jsx";
import {useNavigate} from "react-router-dom";
import axiosConfig from "../util/axiosConfig.jsx";
import {API_ENDPOINTS} from "../util/apiEndpoints.js";
import toast from "react-hot-toast";
import {
    redirectToExpiredSessionLogin,
    resetAuthRedirectState,
} from "../util/authRedirect.js";

export const useUser = () => {
    const {user, setUser, clearUser} = useContext(AppContext);
    const navigate = useNavigate();
    const fetching = useRef(false);

    useEffect(() => {
        if (user) {
            fetching.current = false;
            resetAuthRedirectState();
            return;
        }
        if (fetching.current) {
            return;
        }
        fetching.current = true;

        let cancelled = false;

        const fetchUserInfo = async () => {
            try {
                const response = await axiosConfig.get(API_ENDPOINTS.GET_USER_INFO);

                if (!cancelled && response.data) {
                    setUser(response.data);
                }

            }catch (error) {
                console.log("Failed to fetch the user info", error);
                if (!cancelled) {
                    const isUnauthorized = error.response && (error.response.status === 401 || error.response.status === 403);
                    if (isUnauthorized) {
                        clearUser();
                        redirectToExpiredSessionLogin({
                            status: error.response?.status,
                            replace: (targetPath) => navigate(targetPath, { replace: true }),
                        });
                    } else {
                        // Connection/network error or 5xx server error
                        console.warn("Connection to server failed. Preserving active session.");
                        toast.error(
                            "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.",
                            { id: "server-connection-error" }
                        );
                    }
                }
            } finally {
                fetching.current = false;
            }
        }

        fetchUserInfo();

        return () => {
            cancelled = true;
        }
    }, [user, setUser, clearUser, navigate]);

}
