import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "react-toastify";
import axios from 'axios'

// Export the context directly so it can be used with useContext
export const AppContext = createContext();

// Custom hook to use the context
export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const currencySymbol = '₹'
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [doctors, setDoctors] = useState([])
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [user, setUser] = useState(null);

    // Getting Doctors using API
    const getDoctosData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/doctor/list')
            if (data.success) {
                setDoctors(data.doctors)
                return data.doctors;
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
        return [];
    }

    // Getting User Profile using API
    const loadUserProfileData = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/user/get-profile', { 
                headers: { token } 
            })

            if (data.success) {
                setUser(data.userData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    useEffect(() => {
        getDoctosData()
    }, [])

    useEffect(() => {
        if (token) {
            loadUserProfileData()
        }
    }, [token])

    // Function to format the date eg. ( 20_01_2000 => 20 Jan 2000 )
    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_')
        // Subtract 1 from month index since months array is 0-indexed but stored month is now 1-indexed
        return dateArray[0] + " " + months[Number(dateArray[1]) - 1] + " " + dateArray[2]
    }

    const value = {
        doctors, getDoctosData,
        currencySymbol,
        backendUrl,
        token, setToken,
        user, setUser,
        loadUserProfileData
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )

}

export default AppProvider