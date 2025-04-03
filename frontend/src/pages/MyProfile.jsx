import { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import ImageUploader from '../components/ImageUploader'

const MyProfile = () => {
    const [isEdit, setIsEdit] = useState(false)
    const [image, setImage] = useState(null)
    const { token, backendUrl, user, setUser, loadUserProfileData } = useContext(AppContext)

    // Function to handle image change
    const handleImageChange = (file) => {
        setImage(file);
    };

    // Function to update user profile data using API
    const updateUserProfileData = async () => {
        try {
            const formData = new FormData();

            formData.append('name', user.name)
            formData.append('phone', user.phone)
            formData.append('address', JSON.stringify(user.address))
            formData.append('gender', user.gender)
            formData.append('dob', user.dob)
            formData.append('userId', user._id)

            // Only append image if it exists
            if (image) {
                formData.append('image', image)
            }

            const { data } = await axios.post(backendUrl + '/api/user/update-profile', formData, { 
                headers: { token } 
            })

            if (data.success) {
                toast.success(data.message)
                await loadUserProfileData()
                setIsEdit(false)
                setImage(null)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Cancel edit mode
    const cancelEdit = () => {
        setIsEdit(false);
        setImage(null);
    };

    return user ? (
        <div className='max-w-lg flex flex-col gap-2 text-sm pt-5'>
            {/* Profile Image */}
            <div className="flex justify-center mb-4">
                {isEdit ? (
                    <ImageUploader 
                        onImageChange={handleImageChange}
                        currentImage={user.image}
                        size="large"
                    />
                ) : (
                    <div className="w-36 h-36 rounded-full overflow-hidden">
                        <img 
                            className='w-full h-full object-cover' 
                            src={user.image} 
                            alt={user.name} 
                        />
                    </div>
                )}
            </div>

            {/* Name */}
            {isEdit
                ? <input 
                    className='bg-gray-50 text-3xl font-medium max-w-60 p-2 rounded border border-gray-200' 
                    type="text" 
                    onChange={(e) => setUser(prev => ({ ...prev, name: e.target.value }))} 
                    value={user.name} 
                  />
                : <p className='font-medium text-3xl text-[#262626] mt-4'>{user.name}</p>
            }

            <hr className='bg-[#ADADAD] h-[1px] border-none my-4' />

            {/* Contact Information */}
            <div>
                <p className='text-gray-600 underline mt-3 mb-2 font-medium'>CONTACT INFORMATION</p>
                <div className='grid grid-cols-[1fr_3fr] gap-y-3 mt-3 text-[#363636]'>
                    <p className='font-medium'>Email id:</p>
                    <p className='text-blue-500'>{user.email}</p>
                    
                    <p className='font-medium'>Phone:</p>
                    {isEdit
                        ? <input 
                            className='bg-gray-50 max-w-52 p-2 rounded border border-gray-200' 
                            type="text" 
                            onChange={(e) => setUser(prev => ({ ...prev, phone: e.target.value }))} 
                            value={user.phone} 
                          />
                        : <p className='text-blue-500'>{user.phone}</p>
                    }

                    <p className='font-medium'>Address:</p>
                    {isEdit
                        ? <div className="flex flex-col gap-2">
                            <input 
                                className='bg-gray-50 p-2 rounded border border-gray-200' 
                                type="text" 
                                placeholder="Address Line 1"
                                onChange={(e) => setUser(prev => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))} 
                                value={user.address.line1} 
                            />
                            <input 
                                className='bg-gray-50 p-2 rounded border border-gray-200' 
                                type="text" 
                                placeholder="Address Line 2"
                                onChange={(e) => setUser(prev => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))} 
                                value={user.address.line2} 
                            />
                        </div>
                        : <p className='text-gray-500'>{user.address.line1} <br /> {user.address.line2}</p>
                    }
                </div>
            </div>

            {/* Basic Information */}
            <div>
                <p className='text-gray-600 underline mt-3 mb-2 font-medium'>BASIC INFORMATION</p>
                <div className='grid grid-cols-[1fr_3fr] gap-y-3 mt-3 text-gray-600'>
                    <p className='font-medium'>Gender:</p>
                    {isEdit
                        ? <select 
                            className='max-w-40 bg-gray-50 p-2 rounded border border-gray-200' 
                            onChange={(e) => setUser(prev => ({ ...prev, gender: e.target.value }))} 
                            value={user.gender} 
                          >
                            <option value="Not Selected">Not Selected</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        : <p className='text-gray-500'>{user.gender}</p>
                    }

                    <p className='font-medium'>Birthday:</p>
                    {isEdit
                        ? <input 
                            className='max-w-40 bg-gray-50 p-2 rounded border border-gray-200' 
                            type='date' 
                            onChange={(e) => setUser(prev => ({ ...prev, dob: e.target.value }))} 
                            value={user.dob} 
                          />
                        : <p className='text-gray-500'>{user.dob}</p>
                    }
                </div>
            </div>
            
            {/* Action Buttons */}
            <div className='mt-6 flex gap-3'>
                {isEdit ? (
                    <>
                        <button 
                            onClick={updateUserProfileData} 
                            className='bg-primary-500 text-white px-8 py-2 rounded-full hover:bg-primary-600 transition-all'
                        >
                            Save changes
                        </button>
                        <button 
                            onClick={cancelEdit} 
                            className='border border-gray-300 px-8 py-2 rounded-full hover:bg-gray-100 transition-all'
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={() => setIsEdit(true)} 
                        className='border border-primary-500 px-8 py-2 rounded-full hover:bg-primary-500 hover:text-white transition-all'
                    >
                        Edit Profile
                    </button>
                )}
            </div>
        </div>
    ) : null
}

export default MyProfile