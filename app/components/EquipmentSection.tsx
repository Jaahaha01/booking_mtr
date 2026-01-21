import React from 'react';

interface EquipmentSectionProps {
  roomEquipment?: string | string[];
  equipment: any;
  setEquipment: any;
  wantEquipment: boolean;
  setWantEquipment: any;
}

const EquipmentSection: React.FC<EquipmentSectionProps> = ({ roomEquipment = '', equipment, setEquipment, wantEquipment, setWantEquipment }) => {
  const equipmentList = Array.isArray(roomEquipment)
    ? roomEquipment
    : typeof roomEquipment === 'string'
      ? roomEquipment.split(',').map(e => e.trim()).filter(Boolean)
      : [];
  const handleWantEquipment = (val: boolean) => {
    setWantEquipment(val);
    if (!val) {
      setEquipment({
        mic: false,
        micQty: 1,
        speaker: false,
        speakerQty: 1,
        projector: false,
        projectorQty: 1,
        screen: false,
        screenQty: 1,
        other: false,
        otherText: ""
      });
    }
  };
  const handleEquipmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setEquipment((prev: any) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };
  return (
    <div className="mb-8">
      <div className="p-0 max-w-3xl mx-auto">
        <div className="mb-4">
          <h2 className="text-lg md:text-xl font-bold text-black">อุปกรณ์เสริมสำหรับห้องประชุม</h2>
        </div>
        <div className="flex gap-6 flex-wrap mb-6">
          <label className="flex items-center gap-2 cursor-pointer text-black">
            <input
              type="radio"
              name="want_equipment"
              checked={wantEquipment}
              onChange={() => handleWantEquipment(true)}
              className="accent-fuchsia-600 scale-110"
            />
            <span className="font-medium">ต้องการอุปกรณ์เสริม</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-black">
            <input
              type="radio"
              name="want_equipment"
              checked={!wantEquipment}
              onChange={() => handleWantEquipment(false)}
              className="accent-gray-400 scale-110"
            />
            <span className="font-medium">ไม่ต้องการอุปกรณ์เสริม</span>
          </label>
        </div>
        {wantEquipment && (
          <div className="space-y-8">
            {/* หมวดเครื่องเสียง */}
            <div className="pb-4">
              <div className="flex items-center mb-2">
                <span className="font-semibold text-black">เครื่องเสียง</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-0">
                  <input
                    type="checkbox"
                    id="mic"
                    name="mic"
                    className="accent-fuchsia-600 scale-110"
                    checked={equipment.mic}
                    onChange={handleEquipmentChange}
                  />
                  <label htmlFor="mic" className="text-black font-medium">ไมโครโฟน</label>
                  <span className="ml-2 text-black">x</span>
                  <input
                    type="number"
                    min={1}
                    name="micQty"
                    value={equipment.micQty}
                    onChange={handleEquipmentChange}
                    className="w-12 px-2 py-1 ml-1 bg-transparent text-right text-black"
                    disabled={!equipment.mic}
                  />
                </div>
                <div className="flex items-center gap-2 p-0">
                  <input
                    type="checkbox"
                    id="speaker"
                    name="speaker"
                    className="accent-fuchsia-600 scale-110"
                    checked={equipment.speaker}
                    onChange={handleEquipmentChange}
                  />
                  <label htmlFor="speaker" className="text-black font-medium">ลำโพง</label>
                  <span className="ml-2 text-black">x</span>
                  <input
                    type="number"
                    min={1}
                    name="speakerQty"
                    value={equipment.speakerQty}
                    onChange={handleEquipmentChange}
                    className="w-12 px-2 py-1 ml-1 bg-transparent text-right text-black"
                    disabled={!equipment.speaker}
                  />
                </div>
              </div>
            </div>
            {/* หมวดภาพ/โปรเจคเตอร์ */}
            <div className="pb-4">
              <div className="flex items-center mb-2">
                <span className="font-semibold text-black">ภาพ/โปรเจคเตอร์</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-0">
                  <input
                    type="checkbox"
                    id="projector"
                    name="projector"
                    className="accent-fuchsia-600 scale-110"
                    checked={equipment.projector}
                    onChange={handleEquipmentChange}
                  />
                  <label htmlFor="projector" className="text-black font-medium">โปรเจคเตอร์</label>
                  <span className="ml-2 text-black">x</span>
                  <input
                    type="number"
                    min={1}
                    name="projectorQty"
                    value={equipment.projectorQty}
                    onChange={handleEquipmentChange}
                    className="w-12 px-2 py-1 ml-1 bg-transparent text-right text-black"
                    disabled={!equipment.projector}
                  />
                </div>
                <div className="flex items-center gap-2 p-0">
                  <input
                    type="checkbox"
                    id="screen"
                    name="screen"
                    className="accent-fuchsia-600 scale-110"
                    checked={equipment.screen}
                    onChange={handleEquipmentChange}
                  />
                  <label htmlFor="screen" className="text-black font-medium">จอภาพ</label>
                  <span className="ml-2 text-black">x</span>
                  <input
                    type="number"
                    min={1}
                    name="screenQty"
                    value={equipment.screenQty}
                    onChange={handleEquipmentChange}
                    className="w-12 px-2 py-1 ml-1 bg-transparent text-right text-black"
                    disabled={!equipment.screen}
                  />
                </div>
              </div>
            </div>
            {/* หมวดอื่น ๆ */}
            <div>
              <div className="flex items-center mb-2">
                <span className="font-semibold text-black">อื่น ๆ</span>
              </div>
              <div className="flex items-center gap-2 p-0">
                <input
                  type="checkbox"
                  id="other"
                  name="other"
                  className="accent-pink-600 scale-110"
                  checked={equipment.other}
                  onChange={handleEquipmentChange}
                />
                <label htmlFor="other" className="text-black font-medium">อื่น ๆ</label>
                <input
                  type="text"
                  name="otherText"
                  placeholder="ระบุอุปกรณ์"
                  className="w-32 px-2 py-1 border rounded ml-2 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none border-fuchsia-200"
                  value={equipment.otherText}
                  onChange={handleEquipmentChange}
                  disabled={!equipment.other}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentSection;
