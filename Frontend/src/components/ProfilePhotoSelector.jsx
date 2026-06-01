import {useRef, useState} from "react";
import {Trash, Upload, User} from "lucide-react";

const ProfilePhotoSelector = ({setImage, currentImageUrl = "", onRemoveCurrentImage}) => {
    const inputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = (e) => {
        e.preventDefault();
        setImage(null);
        setPreviewUrl(null);
        if (inputRef.current) inputRef.current.value = "";
        onRemoveCurrentImage?.();
    };

    const onChooseFile = (e) => {
        e.preventDefault();
        inputRef.current?.click();
    };

    const displayedImage = previewUrl || currentImageUrl;

    return (
        <div className="flex justify-center mb-6">
            <input
                type="file"
                accept="image/*"
                ref={inputRef}
                onChange={handleImageChange}
                className="hidden"
            />

            {!displayedImage ? (
                <div className="w-20 h-20 flex items-center justify-center bg-violet-500/10 rounded-full relative">
                    <User className="text-violet-500 dark:text-violet-400" size={35} />
                    <button
                        onClick={onChooseFile}
                        className="w-8 h-8 flex items-center justify-center bg-amber-500 text-white rounded-full absolute -bottom-1 -right-1 hover:bg-amber-600 transition-colors"
                    >
                        <Upload size={15} />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <img src={displayedImage} alt="profile photo" className="w-20 h-20 rounded-full object-cover ring-2 ring-white/20" />
                    <button
                        onClick={handleRemoveImage}
                        className="w-8 h-8 flex items-center justify-center bg-red-600 text-white rounded-full absolute -bottom-1 -right-1 hover:bg-red-700 transition-colors"
                    >
                        <Trash size={15} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfilePhotoSelector;
