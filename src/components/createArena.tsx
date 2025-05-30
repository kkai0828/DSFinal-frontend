import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface Arena {
  id: string;
  title: string;
  address: string;
  capacity: number;
}

const CreateArena = () => {
  const { jwtToken, role } = useAuth();
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState<number>(9999);
  const navigate = useNavigate();

  const [timeErrors, setTimeErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 重置錯誤
    setTimeErrors({});

    if (!title || !address || !capacity) {
      alert("資料不得為空");
      return;
    }

    const areanaData = {
      title: title,
      address: address,
      capacity: capacity,
    };

    try {
      const response = await fetch("/arenas/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(areanaData),
      });
      if (!response.ok) {
        try {
          const errorData = await response.text();
          console.error(`錯誤狀態: ${response.status}, 詳情:`, errorData);
        } catch (e) {
          console.error("無法讀取錯誤詳情:", e);
          alert(`新增活動失敗: ${response.status}`);
        }
        return;
      }

      const responseData = await response.json();

      alert("新增活動成功");
      navigate("/");
    } catch (error) {
      console.error("發送請求時出錯:", error);
    }
  };
  return (
    <div>
      <p className="page-title">新增場館</p>
      <form onSubmit={handleSubmit}>
        <div className="input-gruop">
          <label htmlFor="title">場館名稱：</label>
          <input 
            type="text" 
            id="title"
            onChange={(e) => setTitle(e.target.value)}
            required
            className="input"
          />
        </div>

        <div className="input-gruop">
          <label htmlFor="address">地址：</label>
          <input 
            type="text"
            id="address"
            onChange={(e) => setAddress(e.target.value)}
            required
            className="input"
            />
        </div>

        <div className="input-gruop">
          <label htmlFor="capacity">人數限制：</label>
          <input 
            type="number" 
            id="capacity"
            onChange={(e) => setCapacity(parseInt(e.target.value))}
            required
            className="input"
            min={0}
            max={1000000}
            />
        </div>

        <button type="submit" className="submit-button">
          確認新增
        </button>
      </form>
    </div>
  );
};

export default CreateArena;
