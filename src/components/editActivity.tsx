import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { listArena } from '../context/kits'
import { useNavigate, useParams } from 'react-router-dom'

interface Arena {
  id: string
  title: string
  address: string
  capacity: number
}

interface ActivityData {
  id: string
  title: string
  content: string
  price: number
  on_sale_date: string
  start_time: string
  end_time: string
  cover_image: string
  arena_id: string
}

const EditActivity = () => {
  const { id: activityId } = useParams<{ id: string }>()
  const { jwtToken, role } = useAuth()
  const navigate = useNavigate()

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
  const [timeErrors, setTimeErrors] = useState<{ [key: string]: string }>({})
  const [contentLength, setContentLength] = useState(0)
  const MAX_CONTENT_LENGTH = 300

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])
  
  useEffect(() => {
    
    const fetchActivityDetails = async () => {
      if (!activityId) {
        setError('活動 ID 無效')
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const response = await fetch(`/activities/${activityId}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: response.statusText }))
          throw new Error(errorData.detail || `無法獲取活動詳情: ${response.status}`)
        }
        const data: ActivityData = await response.json()
        
        const formatToInputDateTime = (isoDateTime: string | undefined) => {
          if (!isoDateTime) return ''
          const dateObj = new Date(isoDateTime)
          if (isNaN(dateObj.getTime())) return ''
          const year = dateObj.getFullYear()
          const month = String(dateObj.getMonth() + 1).padStart(2, '0')
          const day = String(dateObj.getDate()).padStart(2, '0')
          const hours = String(dateObj.getHours()).padStart(2, '0')
          const minutes = String(dateObj.getMinutes()).padStart(2, '0')
          return `${year}-${month}-${day}T${hours}:${minutes}`
        }

        setTitle(data.title || '')
        setContent(data.content || '')
        setContentLength(data.content?.length || 0)
        setPrice(data.price === null || data.price === undefined ? undefined : Number(data.price))
        setOnSaleDate(formatToInputDateTime(data.on_sale_date))
        setStartTime(formatToInputDateTime(data.start_time))
        setEndTime(formatToInputDateTime(data.end_time))
        setCoverImg(data.cover_image || '')
        if (data.cover_image) {
          setImagePreview(data.cover_image)
        }
        setArenaId(data.arena_id || '')

      } catch (err: any) {
        console.error('獲取活動詳情失敗:', err)
        setError(err.message || '獲取活動數據時發生錯誤')
      } finally {
        setLoading(false)
      }
    }

    if (jwtToken) { 
      listArena(setArenas)
      fetchActivityDetails()
    } else {
      setError("需要登入才能編輯活動。")
      setLoading(false)
    }
  }, [activityId, jwtToken])

  // Helper functions from createActivity.tsx
  // 驗證時間是否晚於當前時間
  const validateFutureTime = (timeStr: string, fieldName: string): boolean => {
    if (!timeStr) return true; 
    const selectedTime = new Date(timeStr);
    const now = new Date();
    if (isNaN(selectedTime.getTime())) return false;
    if (selectedTime <= now) {
      setTimeErrors(prev => ({ ...prev, [fieldName]: `${fieldName}必須晚於當前時間` }));
      return false;
    }
    setTimeErrors(prev => { const newErrors = {...prev}; delete newErrors[fieldName]; return newErrors; });
    return true;
  };

  // 驗證開始時間和結束時間的先後順序
  const validateTimeOrder = (startTime: string, endTime: string): boolean => {
    if (!startTime || !endTime) return true; 
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
    if (start >= end) {
      setTimeErrors(prev => ({ ...prev, timeOrder: '開始時間必須早於結束時間' }));
      return false;
    }
    setTimeErrors(prev => { const newErrors = {...prev}; delete newErrors.timeOrder; return newErrors; });
    return true;
  };

  // 驗證開賣日是否早於開始時間
  const validateOnSaleBeforeStart = (onSaleDate: string, startTime: string): boolean => {
    if (!onSaleDate || !startTime) return true;
    const onSale = new Date(onSaleDate);
    const start = new Date(startTime);
    if (isNaN(onSale.getTime()) || isNaN(start.getTime())) return false;
    if (onSale >= start) {
      setTimeErrors(prev => ({ ...prev, onSaleTimeOrder: '開賣日必須早於開始時間' }));
      return false;
    }
    setTimeErrors(prev => { const newErrors = {...prev}; delete newErrors.onSaleTimeOrder; return newErrors; });
    return true;
  };

  // 時間輸入變更處理函數 (類似 createActivity)
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = e.target.value;
    setStartTime(newStartTime);
    validateFutureTime(newStartTime, '開始時間');
    if (end_time) validateTimeOrder(newStartTime, end_time);
    if (on_sale_date) validateOnSaleBeforeStart(on_sale_date, newStartTime);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndTime = e.target.value;
    setEndTime(newEndTime);
    validateFutureTime(newEndTime, '結束時間');
    if (start_time) validateTimeOrder(start_time, newEndTime);
  };

  const handleOnSaleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOnSaleDate = e.target.value;
    setOnSaleDate(newOnSaleDate);
    validateFutureTime(newOnSaleDate, '開賣日');
    if (start_time) validateOnSaleBeforeStart(newOnSaleDate, start_time);
  };

  // 圖片處理函數 (類似 createActivity)
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setCoverImg(url); // Store the URL itself
    setImageError(null);
    if (url.trim() !== '') {
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('請選擇有效的圖片文件');
      return;
    }
    setImageError(null);
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    setCoverImg(objectUrl); // For submission, we might need a strategy to upload this file or use its blob URL if backend supports it temporarily.
                           // For now, this makes preview work. If backend expects a URL after upload, this needs adjustment for actual file upload.
  };

  const handleImageError = () => {
    setImageError('圖片URL無效或無法載入，請檢查URL是否正確');
    setImagePreview(null);
  };

  // 價格輸入處理 (類似 createActivity)
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setPrice(undefined);
    } else {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        setPrice(numValue);
      }
    }
  };

  // 說明內容變更 (類似 createActivity)
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const length = text.length;
    if (length > MAX_CONTENT_LENGTH) {
      setContent(text.substring(0, MAX_CONTENT_LENGTH));
      setContentLength(MAX_CONTENT_LENGTH);
    } else {
      setContent(text);
      setContentLength(length);
    }
  };

  // handleSubmit function - for editing
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTimeErrors({});

    // Perform validations
    const startTimeValid = validateFutureTime(start_time, '開始時間');
    const endTimeValid = validateFutureTime(end_time, '結束時間');
    const onSaleDateValid = validateFutureTime(on_sale_date, '開賣日');
    const timeOrderValid = validateTimeOrder(start_time, end_time);
    const onSaleBeforeStartValid = validateOnSaleBeforeStart(on_sale_date, start_time);

    if (!startTimeValid || !endTimeValid || !onSaleDateValid || !timeOrderValid || !onSaleBeforeStartValid) {
      document.getElementById('time-errors')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (!title || !content || price === undefined || !start_time || !end_time || !on_sale_date || !arena_id || !cover_image) {
      alert('所有欄位皆不得為空');
      return;
    }

    // Prepare data for submission
    const activityData = {
      title,
      content,
      price,
      on_sale_date,
      start_time,
      end_time,
      cover_image, // This should be a URL. If it's a blob URL from a new file, backend needs to handle it or it needs to be uploaded first.
      arena_id,
    };

    try {
      const response = await fetch(`/activities/${activityId}`, {
        method: 'PUT', // Or PATCH
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(activityData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `更新活動失敗: ${response.status}`);
      }

      alert('活動更新成功！');
      navigate('/manage-activities'); // Or wherever you want to redirect after edit

    } catch (err: any) {
      console.error('更新活動時出錯:', err);
      // Display error to user, e.g., using a state variable for an error message
      alert(`錯誤: ${err.message}`);
    }
  };

  if (!jwtToken) {
    return <div>您尚未登入或登入已過期，請先登入。</div>
  }

  if (role !== 'host') {
    return <h2>權限不足：需要主辦方權限</h2>
  }

  if (loading) {
    return <div className="create-activity-container"><p>正在載入活動資料...</p></div>
  }

  if (error) {
    return <div className="create-activity-container"><p style={{ color: 'red' }}>錯誤: {error}</p></div>
  }

  return (
    <div className="create-activity-container">
      <p className="page-title">編輯活動 (ID: {activityId})</p>
      <form onSubmit={handleSubmit}>
        {/* Title */}
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

        {/* Content / Description */}
        <div className="input-group">
          <label htmlFor="content">
            說明：
            <span style={{ fontSize: '0.9em', color: contentLength >= MAX_CONTENT_LENGTH ? '#c62828' : '#666' }}>
              ({contentLength}/{MAX_CONTENT_LENGTH}字)
            </span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={handleContentChange}
            required
            className="textarea"
            placeholder="請輸入活動說明，最多300字"
            maxLength={MAX_CONTENT_LENGTH}
            style={{ border: contentLength >= MAX_CONTENT_LENGTH ? '1px solid #c62828' : undefined }}
          ></textarea>
          <p style={{ fontSize: '0.85em', color: '#666', margin: '5px 0 0 0', display: 'flex', justifyContent: 'space-between' }}>
            <span>請簡要描述活動內容、特色及須知</span>
            <span style={{ color: contentLength >= MAX_CONTENT_LENGTH ? '#c62828' : contentLength >= MAX_CONTENT_LENGTH * 0.9 ? '#ff9800' : '#666' }}>
              {contentLength >= MAX_CONTENT_LENGTH ? '已達字數上限' : contentLength >= MAX_CONTENT_LENGTH * 0.9 ? '接近字數上限' : `還可輸入${MAX_CONTENT_LENGTH - contentLength}字`}
            </span>
          </p>
        </div>

        {/* Price */}
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
        
        {/* Start Time */}
        <div className="input-group">
          <label htmlFor="start_time">開始時間：</label>
          <input
            type="datetime-local"
            id="start_time"
            value={start_time}
            onChange={handleStartTimeChange}
            required
            className="input"
          />
          {timeErrors['開始時間'] && <p style={{ color: '#c62828', margin: '5px 0 0 0', fontSize: '0.9em' }}>{timeErrors['開始時間']}</p>}
        </div>

        {/* End Time */}
        <div className="input-group">
          <label htmlFor="end_time">結束時間：</label>
          <input
            type="datetime-local"
            id="end_time"
            value={end_time}
            onChange={handleEndTimeChange}
            required
            className="input"
          />
          {timeErrors['結束時間'] && <p style={{ color: '#c62828', margin: '5px 0 0 0', fontSize: '0.9em' }}>{timeErrors['結束時間']}</p>}
        </div>

        {/* On Sale Date */}
        <div className="input-group">
          <label htmlFor="on_sale_date">開賣日：</label>
          <input
            type="datetime-local"
            id="on_sale_date"
            value={on_sale_date}
            onChange={handleOnSaleDateChange}
            required
            className="input"
          />
          {timeErrors['開賣日'] && <p style={{ color: '#c62828', margin: '5px 0 0 0', fontSize: '0.9em' }}>{timeErrors['開賣日']}</p>}
        </div>

        {/* Arena Selection */}
        <div className="input-group">
          <label htmlFor="arena_id">場館：</label>
          <select
            id="arena_id"
            value={arena_id}
            onChange={(e) => setArenaId(e.target.value)}
            required
            className="select"
          >
            <option value="">選擇場館</option>
            {Array.isArray(arenas) && arenas.map((arena) => (
              <option key={arena.id} value={arena.id}>
                {arena.title} 
              </option>
            ))}
          </select>
        </div>

        {/* Cover Image Input */}
        <div className="input-group">
          <label htmlFor="cover_image">封面圖片：</label>
          {/* <div style={{ marginBottom: '10px' }}> 
            <button type="button" onClick={() => setUploadMode('url')} style={{ padding: '5px 10px', backgroundColor: uploadMode === 'url' ? '#4a90e2' : '#f0f0f0', color: uploadMode === 'url' ? 'white' : 'black', border: '1px solid #ddd', borderRadius: '4px 0 0 4px', cursor: 'pointer' }}>URL輸入</button>
            <button type="button" onClick={() => setUploadMode('file')} style={{ padding: '5px 10px', backgroundColor: uploadMode === 'file' ? '#4a90e2' : '#f0f0f0', color: uploadMode === 'file' ? 'white' : 'black', border: '1px solid #ddd', borderRadius: '0 4px 4px 0', borderLeft: 'none', cursor: 'pointer' }}>本地上傳(預覽用)</button>
          </div> */}
          
          {uploadMode === 'url' && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="url"
                id="cover_image_url_input" // Changed id to avoid conflict if createActivity also uses 'cover_image' for file input
                value={cover_image.startsWith('blob:') ? '' : cover_image} // Don't show blob url in input field
                onChange={handleImageUrlChange}
                placeholder="請輸入圖片URL"
                required={!cover_image.startsWith('blob:')} // Only required if not a blob (i.e. not a newly selected file)
                className="input"
                style={{ flexGrow: 1, marginRight: '10px' }}
              />
            </div>
          )}
          
          {uploadMode === 'file' && (
            <div>
              <input
                type="file"
                id="cover_image_file_input"
                accept="image/*"
                onChange={handleFileSelect}
                className="input-file"
                style={{ width: '100%', padding: '8px' }}
              />
              <p style={{ color: '#888', fontSize: '0.8em', marginTop: '5px' }}>注意：本地上傳僅用於預覽更新。如需永久更改圖片，請上傳至圖床後使用URL輸入。</p>
            </div>
          )}
          
          <div className="image-preview" style={{ marginTop: '10px' }}>
            <p>圖片預覽：</p>
            {imageError ? (
              <div style={{ padding: '15px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '10px' }}>
                <p style={{ margin: 0 }}>{imageError}</p>
              </div>
            ) : imagePreview ? (
              <img src={imagePreview} alt="封面圖預覽" style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ddd', borderRadius: '4px', padding: '5px' }} onError={handleImageError} />
            ) : (
              <div style={{ padding: '15px', backgroundColor: '#f5f5f5', color: '#757575', borderRadius: '4px', textAlign: 'center' }}>尚未選擇或載入圖片</div>
            )}
          </div>
        </div>

        {/* Time Errors Display */}
        {Object.keys(timeErrors).length > 0 && (
          <div id="time-errors" style={{ padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '15px' }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>時間設定錯誤：</p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {Object.entries(timeErrors).map(([key, errorMsg]) => (
                <li key={key}>{errorMsg}</li>
              ))}
            </ul>
          </div>
        )}

        <button type="submit" className="submit-button">
          確認修改
        </button>
      </form>
    </div>
  )
}

export default EditActivity
