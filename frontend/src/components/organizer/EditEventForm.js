import React, { useState, useEffect } from 'react';
import CreateEventForm from './CreateEventForm';

const EditEventForm = ({ event, onSubmit, onCancel }) => {
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    if (event) {
      // Convert event data to form format
      const formData = {
        title: event.title || '',
        description: event.description || '',
        event_type: event.event_type || '',
        event_date: event.event_date || '',
        start_time: event.start_time || '',
        end_time: event.end_time || '',
        venue_name: event.venue_name || '',
        venue_address: event.venue_address || '',
        venue_city: event.venue_city || '',
        venue_state: event.venue_state || '',
        venue_country: event.venue_country || 'USA',
        budget_min: event.budget_min || '',
        budget_max: event.budget_max || '',
        currency: event.currency || 'USD',
        requirements: event.requirements || [],
        is_public: event.is_public !== undefined ? event.is_public : true,
        // Venue details
        venue_capacity: event.venue_details?.capacity || '',
        venue_outdoor: event.venue_details?.outdoor || false,
        venue_sound_system: event.venue_details?.sound_system || false,
        venue_stage_size: event.venue_details?.stage_size || '',
        // Contact info
        contact_name: event.contact_info?.name || '',
        contact_phone: event.contact_info?.phone || '',
        contact_email: event.contact_info?.email || ''
      };
      
      setInitialData(formData);
    }
  }, [event]);

  if (!initialData) {
    return <div>Loading...</div>;
  }

  return (
    <CreateEventForm
      initialData={initialData}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isEdit={true}
    />
  );
};

export default EditEventForm; 