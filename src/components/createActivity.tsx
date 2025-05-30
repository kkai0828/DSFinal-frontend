import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listArena } from '../context/kits'
import { useNavigate } from 'react-router-dom'

interface Arena {
  id: string
  title: string
  address: string
  capacity: number
}

const CreateActivity = () => {
  const { jwtToken, role } = useAuth()
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [content, setContent] = useState('')
  const [on_sale_date, setOnSaleDate] = useState('')
  const [start_time, setStartTime] = useState('')
  const [end_time, setEndTime] = useState('')
  const [cover_image, setCoverImg] = useState('')
  const [arena_id, setArenaId] = useState('')
  const [arenas, setArenas] = useState<Arena[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url')
  const [imageError, setImageError] = useState<string | null>(null)
  const navigate = useNavigate()
  
  // 獲取場館列表
  React.useEffect(() => {
    const fetchArenas = async () => {
        await listArena(setArenas);
    };
    
    fetchArenas();
  }, []);
  
  // 組件卸載時清理臨時URL
  React.useEffect(() => {
    // 返回清理函數
    return () => {
      // 釋放臨時URL資源
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);
  
  // 添加檢查確認當前登錄狀態
  if (!jwtToken) {
    return <div>您尚未登入或登入已過期，請先登入。</div>
  }

  if (role !== 'host') {
    return <h2>權限不足：需要主辦方權限</h2>
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !title ||
      !content ||
      !price ||
      !start_time ||
      !end_time ||
      !on_sale_date ||
      !arena_id ||
      !cover_image
    ) {
      alert('資料不得為空')
      return
    }
    

    const activityData = { 
      title: title,
      content: content,
      price: price,
      on_sale_date: on_sale_date,
      start_time: start_time,
      end_time: end_time,
      cover_image: cover_image,
      arena_id: arena_id
    }
    
    
    try {
      const response = await fetch('/activities/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityData),
      })
      console.log(JSON.stringify(activityData.on_sale_date))
      if (!response.ok) {
        try {
          const errorData = await response.text();
          console.error(`錯誤狀態: ${response.status}, 詳情:`, errorData);
        } catch (e) {
          console.error('無法讀取錯誤詳情:', e);
          alert(`新增活動失敗: ${response.status}`);
        }
        return;
      }
      
      const responseData = await response.json();
      console.log(responseData);
      
      alert('新增活動成功')
      navigate('/')
    } catch (error) {
      console.error('發送請求時出錯:', error)
    }
  }

  // 處理圖片URL變更，並更新預覽
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setCoverImg(url);
    setImageError(null);
    
    // 如果URL不為空，則設置預覽
    if (url.trim() !== '') {
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  // 處理本地文件選擇
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 檢查文件類型
    if (!file.type.startsWith('image/')) {
      setImageError('請選擇有效的圖片文件');
      return;
    }

    setImageError(null);

    // 先釋放之前的臨時URL資源（如果存在）
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    // 創建臨時URL以供預覽
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    
    // 在實際項目中，這裡應該上傳圖片到服務器並獲取URL
    // 但由於目前沒有後端圖片上傳API，我們使用臨時對象URL
    // 注意：這個URL僅在當前頁面有效，提交後將不可用
    setCoverImg(objectUrl);
    
    // 提示用戶該功能僅用於預覽
    if (uploadMode === 'file') {
      alert('注意：當前環境下，本地上傳僅用於預覽。實際應用中需將圖片上傳至圖床獲取永久URL。');
    }
  };

  // 修改圖片載入錯誤處理
  const handleImageError = () => {
    setImageError('圖片URL無效或無法載入，請檢查URL是否正確');
    setImagePreview(null);
  };

  // 修改價格輸入處理函數
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // 如果輸入為空，設置為undefined
    if (value === '') {
      setPrice(undefined);
    } else {
      // 否則轉換為數字
      const numValue = Number(value);
      // 確保是有效數字
      if (!isNaN(numValue)) {
        setPrice(numValue);
      }
    }
  };

  return (
    <div className="create-activity-container">
      <p className="page-title">管理 / 新增活動</p>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="input-group">
          <label htmlFor="title">活動名稱：</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="input"
          />
        </div>

        <div className="input-group">
          <label htmlFor="content">說明：</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            className="textarea"
          ></textarea>
        </div>
        <div className="input-group">
          <label htmlFor="price">價格：</label>
          <input
            type="number"
            id="price"
            value={price === undefined ? '' : price}
            onChange={handlePriceChange}
            required
            className="input"
          />
        </div>
        
         
        <div className="input-group">
          <label htmlFor="start_time">開始時間：</label>
          <input
            type="datetime-local"
            id="start_time"
            value={start_time}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="input"
          />
        </div>

        <div className="input-group">
          <label htmlFor="end_time">結束時間：</label>
          <input
            type="datetime-local"
            id="end_time"
            value={end_time}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="input"
          />
        </div>

        <div className="input-group">
          <label htmlFor="on_sale_date">開賣日：</label>
          <input
            type="datetime-local"
            id="on_sale_date"
            value={on_sale_date}
            onChange={(e) => setOnSaleDate(e.target.value)}
            required
            className="input"
          />
        </div>

        <div className="input-group">
          <label htmlFor="arena_id">場館：</label>
          <select
            id="arena_id"
            value={arena_id}
            onChange={(e) => {setArenaId(e.target.value)
            }}
            required
            className="select"
          >
            <option value="">選擇場館</option>
            {arenas.map((arena) => (
              <option key={arena.id} value={arena.id}>
                {arena.title} 
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="cover_image">封面圖片：</label>
          
          {/* 上傳模式切換 */}
          <div style={{ marginBottom: '10px' }}>
            <button 
              type="button" 
              onClick={() => setUploadMode('url')}
              style={{ 
                padding: '5px 10px',
                backgroundColor: uploadMode === 'url' ? '#4a90e2' : '#f0f0f0',
                color: uploadMode === 'url' ? 'white' : 'black',
                border: '1px solid #ddd',
                borderRadius: '4px 0 0 4px',
                cursor: 'pointer'
              }}
            >
              URL輸入
            </button>
            <button 
              type="button" 
              onClick={() => setUploadMode('file')}
              style={{ 
                padding: '5px 10px',
                backgroundColor: uploadMode === 'file' ? '#4a90e2' : '#f0f0f0',
                color: uploadMode === 'file' ? 'white' : 'black',
                border: '1px solid #ddd',
                borderRadius: '0 4px 4px 0',
                borderLeft: 'none',
                cursor: 'pointer'
              }}
            >
              本地上傳
            </button>
          </div>
          
          {/* URL輸入模式 */}
          {uploadMode === 'url' && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="url"
                id="cover_image"
                value={cover_image}
                onChange={handleImageUrlChange}
                placeholder="請輸入圖片URL，例如: https://example.com/image.jpg"
                required
                className="input"
                style={{ flexGrow: 1, marginRight: '10px' }}
              />
            </div>
          )}
          
          {/* 文件上傳模式 */}
          {uploadMode === 'file' && (
            <div>
              <input
                type="file"
                id="cover_image_file"
                accept="image/*"
                onChange={handleFileSelect}
                className="input-file"
                style={{ width: '100%', padding: '8px' }}
              />
              <p style={{ color: '#888', fontSize: '0.8em', marginTop: '5px' }}>
                注意：選擇文件後僅用於預覽，實際需上傳至圖床獲取永久URL
              </p>
            </div>
          )}
          
          {/* 圖片預覽區域 */}
          <div className="image-preview" style={{ marginTop: '10px' }}>
            <p>圖片預覽：</p>
            
            {imageError ? (
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#ffebee', 
                color: '#c62828', 
                borderRadius: '4px',
                marginBottom: '10px'
              }}>
                <p style={{ margin: 0 }}>{imageError}</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>
                  請確保URL格式正確且圖片可公開訪問。如使用本地上傳，請確保選擇有效的圖片文件。
                </p>
              </div>
            ) : imagePreview ? (
              <img 
                src={imagePreview} 
                alt="封面圖預覽" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px', 
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '5px'
                }} 
                onError={handleImageError}
              />
            ) : (
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#f5f5f5', 
                color: '#757575', 
                borderRadius: '4px',
                textAlign: 'center' 
              }}>
                尚未選擇圖片
              </div>
            )}
          </div>
        </div>
        

        <button type="submit" className="submit-button">
          確認新增
        </button>
      </form>
    </div>
  )
}

export default CreateActivity
