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
  const [price, setPrice] = useState('')
  const [content, setContent] = useState('')
  const [activityDate, setActivityDate] = useState('')
  const [on_sale_date, setOnSaleDate] = useState('')
  const [start_time, setStartTime] = useState('')
  const [end_time, setEndTime] = useState('')
  const [cover_image, setCoverImg] = useState('123')
  const [arena_id, setArenaId] = useState('')
  const [arenas, setArenas] = useState<Arena[]>([])
  const navigate = useNavigate()

  React.useEffect(() => {
    listArena(setArenas)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
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
    const formData = new FormData()

    // Append text fields to formData
    formData.append('title', title)
    formData.append('content', content)
    formData.append('price', price)
    formData.append('start_time', start_time)
    formData.append('end_time', end_time)
    formData.append('on_sale_date', on_sale_date)
    formData.append('arena_id', arena_id)
    formData.append('cover_image', cover_image)
  
    try {
      const response = await fetch('/activities/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwtToken}`, // 修改 token 格式
        },
        body: formData,
      })

      if (!response.ok) {
        alert('新增活動失敗')
        return
      }
      alert('新增活動成功')
      navigate('/')
    } catch (error) {
      console.error('Error creating activity:', error)
    }
  }


  if (role !== 'host') {
    return <h2>Permissions denied</h2>
  }

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
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="input"
          />
        </div>
        <div className="input-group">
          <label htmlFor="activity_date">活動日期：</label>
          <input
            type="date"
            id="activity_date"
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
            required
            className="input"
          />
        </div>
        
         
        <div className="input-group">
          <label htmlFor="start_time">開始時間：</label>
          <input
            type="time"
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
            type="time"
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
            onChange={(e) => setArenaId(e.target.value)}
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

        
        {/* <div className="input-group">
          <label htmlFor="cover_img">封面圖</label>
          <input
            type="file"
            id="cover_img"
            accept="image/*"
            onChange={(e) =>
              setCoverImg(e.target.files ? e.target.files[0] : null)
            }
            className="input-file"
          />
        </div> */}
        

        <button type="submit" className="submit-button">
          確認新增
        </button>
      </form>
    </div>
  )
}

export default CreateActivity
