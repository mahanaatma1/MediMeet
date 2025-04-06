import { useState, useEffect, useContext } from 'react';
import { FaPlus, FaTrash, FaTimes, FaSave, FaPrescriptionBottle } from 'react-icons/fa';
import { DoctorContext } from '../context/DoctorContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const PrescriptionForm = ({ appointmentId, onClose, existingPrescription = null, isFullPage = false }) => {
  const { backendUrl, dToken } = useContext(DoctorContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [medications, setMedications] = useState([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  
  // For adding new medication
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    timing: '',
    instructions: ''
  });
  
  // Medication templates
  const frequencyOptions = [
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Four times daily',
    'Every 4 hours',
    'Every 6 hours',
    'Every 8 hours',
    'Every 12 hours',
    'As needed',
    'Weekly',
    'Once every two weeks',
    'Monthly'
  ];
  
  const durationOptions = [
    '3 days',
    '5 days',
    '7 days',
    '10 days',
    '14 days',
    '1 month',
    '2 months',
    '3 months',
    '6 months',
    'Indefinitely'
  ];
  
  const timingOptions = [
    'Before meals',
    'After meals',
    'With meals',
    'Before breakfast',
    'After breakfast',
    'Before lunch',
    'After lunch',
    'Before dinner',
    'After dinner',
    'Before bed',
    'In the morning',
    'In the evening',
    'On an empty stomach'
  ];
  
  // Initialize form if editing an existing prescription
  useEffect(() => {
    if (existingPrescription) {
      setMedications(existingPrescription.medications || []);
      setDiagnosis(existingPrescription.diagnosis || '');
      setNotes(existingPrescription.notes || '');
      
      // Format the follow-up date for the date input
      if (existingPrescription.followUpDate) {
        const followUpDateObj = new Date(existingPrescription.followUpDate);
        setFollowUpDate(followUpDateObj.toISOString().split('T')[0]);
      }
      
      setFollowUpInstructions(existingPrescription.followUpInstructions || '');
    }
  }, [existingPrescription]);
  
  // Search for medications
  const searchMedications = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const headers = { dtoken: dToken };
      const response = await axios.get(
        `${backendUrl}/api/prescription/medications/search?query=${encodeURIComponent(query)}`,
        { headers }
      );
      
      if (response.data.success) {
        setSearchResults(response.data.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching medications:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle medication search
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setNewMedication({ ...newMedication, name: value });
    
    // Debounce search
    const debounceTimer = setTimeout(() => {
      searchMedications(value);
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  };
  
  // Select a medication from search results
  const selectMedication = (med) => {
    setNewMedication({
      ...newMedication,
      name: `${med.name} (${med.strength})`,
    });
    setSearchQuery('');
    setSearchResults([]);
  };
  
  // Add a medication to the prescription
  const addMedication = () => {
    // Validate fields
    if (!newMedication.name || !newMedication.dosage || !newMedication.frequency || !newMedication.duration) {
      toast.error('Please fill in all required medication fields');
      return;
    }
    
    setMedications([...medications, { ...newMedication, isActive: true }]);
    
    // Reset form
    setNewMedication({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      timing: '',
      instructions: ''
    });
    setSearchQuery('');
    setSearchResults([]);
  };
  
  // Remove a medication
  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (medications.length === 0) {
      toast.error('Please add at least one medication');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const prescriptionData = {
        appointmentId,
        medications,
        diagnosis,
        notes,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        followUpInstructions
      };
      
      const headers = { dtoken: dToken };
      
      let response;
      if (existingPrescription) {
        // Update existing prescription
        response = await axios.put(
          `${backendUrl}/api/prescription/update/${existingPrescription._id}`,
          prescriptionData,
          { headers }
        );
      } else {
        // Create new prescription
        response = await axios.post(
          `${backendUrl}/api/prescription/create`,
          prescriptionData,
          { headers }
        );
      }
      
      if (response.data.success) {
        toast.success(existingPrescription ? 'Prescription updated successfully' : 'Prescription created successfully');
        onClose(response.data.data); // Return the created/updated prescription
      } else {
        toast.error(response.data.message || 'Failed to save prescription');
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
      toast.error(error.response?.data?.message || 'Error saving prescription');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={isFullPage ? "" : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"}>
      <div className={isFullPage ? "w-full" : "bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"}>
        <div className="p-6">
          <div className={`flex justify-between items-center mb-6 ${isFullPage ? "hidden" : ""}`}>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaPrescriptionBottle className="mr-2 text-blue-600" />
              {existingPrescription ? 'Update Prescription' : 'Create Prescription'}
            </h2>
            <button 
              onClick={() => onClose()}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Diagnosis Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                <h3 className="font-semibold text-gray-800">Diagnosis</h3>
              </div>
              <div className="p-4">
                <textarea
                  className="w-full border border-gray-300 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  placeholder="Enter diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                ></textarea>
              </div>
            </div>
            
            {/* Medications List Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Medications</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {medications.length} {medications.length === 1 ? 'medication' : 'medications'}
                </span>
              </div>
              <div className="p-4">
                {medications.length > 0 ? (
                  <div className="mb-4 space-y-3">
                    {medications.map((med, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-md p-3 flex justify-between items-start hover:shadow-sm transition-shadow">
                        <div>
                          <div className="font-semibold text-gray-800">{med.name} - {med.dosage}</div>
                          <div className="text-sm text-gray-600 flex flex-wrap gap-2 mt-1">
                            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{med.frequency}</span>
                            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{med.duration}</span>
                            {med.timing && <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{med.timing}</span>}
                          </div>
                          {med.instructions && (
                            <div className="text-sm text-gray-600 mt-2 border-t border-blue-100 pt-2">
                              <span className="font-medium">Instructions:</span> {med.instructions}
                            </div>
                          )}
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeMedication(index)}
                          className="text-red-500 hover:text-red-700 transition-colors bg-white p-1.5 rounded-full hover:bg-red-50"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 mb-4">
                    <p className="text-gray-500">No medications added yet</p>
                    <p className="text-sm text-gray-400 mt-1">Add medications using the form below</p>
                  </div>
                )}
                
                {/* Add New Medication */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FaPlus className="mr-2 text-blue-600 w-4 h-4" />
                    Add Medication
                  </h3>
                  
                  {/* Medication Name with Search */}
                  <div className="mb-3">
                    <label className="block text-gray-700 text-sm font-medium mb-1">Medication Name*</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Search and select medication"
                        value={newMedication.name}
                        onChange={handleSearchChange}
                      />
                      
                      {/* Search Results Dropdown */}
                      {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full bg-white mt-1 border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {searchResults.map((med) => (
                            <div
                              key={med._id}
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => selectMedication(med)}
                            >
                              <div className="font-medium">{med.name} ({med.strength})</div>
                              <div className="text-xs text-gray-500">{med.genericName} - {med.form}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {isSearching && (
                        <div className="absolute right-3 top-2.5">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Medication Dosage */}
                    <div className="mb-3">
                      <label className="block text-gray-700 text-sm font-medium mb-1">Dosage*</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 500mg, 1 tablet, 5ml"
                        value={newMedication.dosage}
                        onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                      />
                    </div>
                  
                    {/* Frequency and Duration */}
                    <div className="mb-3">
                      <label className="block text-gray-700 text-sm font-medium mb-1">Frequency*</label>
                      <select
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={newMedication.frequency}
                        onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                      >
                        <option value="">Select frequency</option>
                        {frequencyOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-3">
                      <label className="block text-gray-700 text-sm font-medium mb-1">Duration*</label>
                      <select
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={newMedication.duration}
                        onChange={(e) => setNewMedication({ ...newMedication, duration: e.target.value })}
                      >
                        <option value="">Select duration</option>
                        {durationOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-gray-700 text-sm font-medium mb-1">Timing</label>
                      <select
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={newMedication.timing}
                        onChange={(e) => setNewMedication({ ...newMedication, timing: e.target.value })}
                      >
                        <option value="">Select timing (optional)</option>
                        {timingOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-gray-700 text-sm font-medium mb-1">Special Instructions</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Special instructions (optional)"
                      value={newMedication.instructions}
                      onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={addMedication}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <FaPlus className="mr-2" />
                    Add Medication
                  </button>
                </div>
              </div>
            </div>
            
            {/* Follow-up & Notes Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Follow-up Section */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                  <h3 className="font-semibold text-gray-800">Follow-up Plan</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Follow-up Date</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]} // Only future dates
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Follow-up Instructions</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Follow-up instructions"
                      value={followUpInstructions}
                      onChange={(e) => setFollowUpInstructions(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Additional Notes */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                  <h3 className="font-semibold text-gray-800">Additional Notes</h3>
                </div>
                <div className="p-4">
                  <textarea
                    className="w-full border border-gray-300 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="5"
                    placeholder="Enter any additional notes or instructions"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => onClose()}
                className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                {isFullPage ? 'Back' : 'Cancel'}
              </button>
              
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    {existingPrescription ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    {existingPrescription ? 'Update Prescription' : 'Save Prescription'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionForm; 