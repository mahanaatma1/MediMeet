import { useState, useRef } from 'react';
import { FaCamera, FaSpinner, FaTimes } from 'react-icons/fa';

const ImageUploader = ({ 
  onImageChange, 
  currentImage = null, 
  className = "",
  size = "medium" // "small", "medium", "large"
}) => {
  const [previewUrl, setPreviewUrl] = useState(currentImage);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Determine size class
  const sizeClass = {
    small: "w-20 h-20",
    medium: "w-32 h-32",
    large: "w-48 h-48"
  }[size] || "w-32 h-32";

  const handleFileSelect = (e) => {
    setError(null);
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!validImageTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, or GIF)');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    
    setIsLoading(true);
    
    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Call the onImageChange callback
    onImageChange(file);
    
    setIsLoading(false);
  };

  const clearImage = (e) => {
    e.stopPropagation();
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageChange(null);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div 
        onClick={triggerFileInput}
        className={`${sizeClass} rounded-full overflow-hidden border-2 border-gray-300 flex items-center justify-center relative cursor-pointer bg-gray-100 hover:bg-gray-200 transition-colors`}
      >
        {isLoading ? (
          <FaSpinner className="animate-spin text-gray-500 text-xl" />
        ) : previewUrl ? (
          <>
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            <button
              onClick={clearImage}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"
            >
              <FaTimes size={12} />
            </button>
          </>
        ) : (
          <FaCamera className="text-gray-500 text-3xl" />
        )}
      </div>
      
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
      
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg, image/png, image/gif"
        className="hidden"
      />
      
      <p className="text-xs text-gray-500 mt-2">
        Click to {previewUrl ? 'change' : 'upload'} image
      </p>
    </div>
  );
};

export default ImageUploader; 