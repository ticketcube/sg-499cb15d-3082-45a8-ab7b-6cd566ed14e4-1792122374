
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import WaitlistService, { WaitlistEntry } from "@/services/waitlistService";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: (waitlistEntry: WaitlistEntry) => void;
}

export default function WaitlistModal({ 
  isOpen, 
  onClose, 
  userId, 
  onSuccess 
}: WaitlistModalProps) {
  const [availableSundays, setAvailableSundays] = useState<Date[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [existingEntry, setExistingEntry] = useState<WaitlistEntry | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Generate available Sundays
      const sundays = WaitlistService.getAvailableSundays();
      setAvailableSundays(sundays);
      
      // Load existing waitlist entry
      loadExistingEntry();
    }
  }, [isOpen, userId]);

  const loadExistingEntry = async () => {
    try {
      const entry = await WaitlistService.getUserWaitlist(userId);
      setExistingEntry(entry);
      
      if (entry) {
        const dates = [entry.avail_1, entry.avail_2, entry.avail_3]
          .filter(date => date !== null) as string[];
        setSelectedDates(dates);
      }
    } catch (error) {
      console.error("Error loading existing waitlist entry:", error);
    }
  };

  const handleDateToggle = (date: Date) => {
    const dateString = WaitlistService.formatDateForDatabase(date);
    
    if (selectedDates.includes(dateString)) {
      // Remove date
      setSelectedDates(selectedDates.filter(d => d !== dateString));
    } else {
      // Add date (max 3)
      if (selectedDates.length < 3) {
        setSelectedDates([...selectedDates, dateString]);
      } else {
        toast({
          variant: "destructive",
          title: "Maximum Reached",
          description: "You can select a maximum of 3 Sundays"
        });
      }
    }
  };

  const handleSave = async () => {
    if (selectedDates.length === 0) {
      toast({
        variant: "destructive",
        title: "Selection Required",
        description: "Please select at least one Sunday"
      });
      return;
    }

    setLoading(true);
    
    try {
      const waitlistEntry = await WaitlistService.upsertWaitlist(userId, selectedDates);
      
      toast({
        title: "Waitlist Updated!",
        description: `Successfully ${existingEntry ? 'updated' : 'joined'} waitlist with ${selectedDates.length} Sunday${selectedDates.length > 1 ? 's' : ''}`
      });

      onSuccess?.(waitlistEntry);
      onClose();
    } catch (error) {
      console.error("Error saving waitlist:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save waitlist selection. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!existingEntry) return;
    
    setLoading(true);
    
    try {
      await WaitlistService.removeFromWaitlist(userId);
      
      toast({
        title: "Removed from Waitlist",
        description: "You have been removed from the waitlist"
      });

      setSelectedDates([]);
      setExistingEntry(null);
      onClose();
    } catch (error) {
      console.error("Error removing from waitlist:", error);
      toast({
        variant: "destructive",
        title: "Remove Failed",
        description: "Failed to remove from waitlist. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const isDateSelected = (date: Date): boolean => {
    const dateString = WaitlistService.formatDateForDatabase(date);
    return selectedDates.includes(dateString);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {existingEntry ? 'Update' : 'Join'} Waitlist
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Select 1-3 Sundays when you're available to play. We'll contact you when spots open up.
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Available Sundays ({selectedDates.length}/3 selected)
            </div>
            
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {availableSundays.map((sunday, index) => {
                const isSelected = isDateSelected(sunday);
                const dateString = WaitlistService.formatDateForDisplay(sunday.toISOString().split('T')[0]);
                
                return (
                  <button
                    key={index}
                    onClick={() => handleDateToggle(sunday)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {WaitlistService.formatDateForDisplay(sunday.toISOString().split('T')[0])}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {selectedDates.length > 0 && (
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-800 mb-1">
                Selected Sundays:
              </div>
              <div className="text-sm text-green-700">
                {selectedDates.map(date => 
                  WaitlistService.formatDateForDisplay(date)
                ).join(", ")}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-3 pt-4">
          {existingEntry && (
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Removing..." : "Remove from Waitlist"}
            </Button>
          )}
          
          <Button
            onClick={handleSave}
            disabled={loading || selectedDates.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Saving..." : existingEntry ? "Update Waitlist" : "Join Waitlist"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
    