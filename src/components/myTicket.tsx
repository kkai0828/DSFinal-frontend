import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'


interface Ticket {
  id: string
  activity_id: string
  region_id: string
  seat_number: number
  is_paid: boolean
}

interface Activity {
  id: string
  on_sale_date: string
  start_time: string
  end_time: string
  price: number
  title: string
  content: string
  cover_image: string
  arena_id: string
  creator_id: string
  is_archived: boolean
}

const MyTicket: React.FC = () => {
  const { jwtToken } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [activities, setActivities] = useState<Record<string, Activity>>({})

  const fetchActivity = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/activities/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setActivities((prev) => ({
          ...prev,
          [id]: data.activity,
        }))
      } else {
        console.error('Failed to fetch activity details for ID:', id, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching activity details for ID:', id, error)
    }
  }, [])

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (!jwtToken) {
        setError('用户未认证，无法获取票务信息。');
        setLoading(false);
        return;
    }

    try {
      const response = await fetch(`/tickets/list`, {
        method: 'GET',
        headers: {
          Authorization: `${jwtToken}`,
        },
        redirect: 'follow',
      })

      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets)

        const activityIdsToFetch = new Set<string>();
        data.tickets.forEach((ticket: Ticket) => {
          if (!activities[ticket.activity_id]) {
            activityIdsToFetch.add(ticket.activity_id);
          }
        });
        activityIdsToFetch.forEach(activityId => fetchActivity(activityId));

      } else {
        const errorText = await response.text()
        if (errorText.includes('No tickets found')) {
            setTickets([]);
            setError(null);
        } else {
            throw new Error(errorText)
        }
      }
    } catch (error: any) {
      console.error('Error fetching tickets:', error)
      setError(error.message || '發生未知錯誤')
    } finally {
      setLoading(false)
    }
  }, [jwtToken, fetchActivity, activities])

  useEffect(() => {
    if (jwtToken) {
      fetchTickets()
    } else {
      setError('請先登入以檢視您的訂單。')
      setLoading(false)
      setTickets([])
    }
  }, [jwtToken, fetchTickets])

  const filteredTickets = tickets.filter((ticket) => {
    if (filter === 'paid') return ticket.is_paid
    if (filter === 'unpaid') return !ticket.is_paid
    return true
  })

  if (loading) {
    return <div>正在加載票務信息...</div>
  }

  if (error) {
    return <div>錯誤: {error}</div>
  }

  return (
    <div>
      <h2>我的訂單</h2>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            background: filter === 'all' ? '#007bff' : '#f8f9fa',
            color: filter === 'all' ? '#fff' : '#000',
            margin: '5px',
            border: '1px solid #ccc',
            padding: '10px',
            cursor: 'pointer',
          }}
        >
          全部
        </button>
        <button
          onClick={() => setFilter('paid')}
          style={{
            background: filter === 'paid' ? '#007bff' : '#f8f9fa',
            color: filter === 'paid' ? '#fff' : '#000',
            margin: '5px',
            border: '1px solid #ccc',
            padding: '10px',
            cursor: 'pointer',
          }}
        >
          已付款
        </button>
        <button
          onClick={() => setFilter('unpaid')}
          style={{
            background: filter === 'unpaid' ? '#007bff' : '#f8f9fa',
            color: filter === 'unpaid' ? '#fff' : '#000',
            margin: '5px',
            border: '1px solid #ccc',
            padding: '10px',
            cursor: 'pointer',
          }}
        >
          未付款
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th
              style={{
                border: '1px solid #ccc',
                padding: '8px',
                textAlign: 'center',
                width: '350px',
              }}
            >
              訂單編號
            </th>
            <th
              style={{
                border: '1px solid #ccc',
                padding: '8px',
                textAlign: 'center',
              }}
            >
              活動
            </th>
            <th
              style={{
                border: '1px solid #ccc',
                padding: '8px',
                textAlign: 'center',
              }}
            >
              座位
            </th>
            <th
              colSpan={2}
              style={{
                border: '1px solid #ccc',
                padding: '8px',
                textAlign: 'center',
              }}
            >
              狀態
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredTickets.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                style={{
                  border: '1px solid #ccc',
                  padding: '8px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                無
              </td>
            </tr>
          ) : (
            filteredTickets.map((ticket) => {
              const activityData = activities[ticket.activity_id]
              return (
                <tr key={ticket.id}>
                  <td
                    style={{
                      border: '1px solid #ccc',
                      padding: '8px',
                      textAlign: 'center',
                    }}
                  >
                    {ticket.id}
                  </td>
                  <td
                    style={{
                      border: '1px solid #ccc',
                      padding: '8px',
                      textAlign: 'center',
                    }}
                  >
                    {activityData ? activityData.title : '載入中...'}
                  </td>
                  <td
                    style={{
                      border: '1px solid #ccc',
                      padding: '8px',
                      textAlign: 'center',
                    }}
                  >
                    {ticket.seat_number}
                  </td>
                  <td
                    colSpan={ticket.is_paid ? 2 : 1}
                    style={{
                      border: '1px solid #ccc',
                      padding: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <span
                      style={{
                        color: ticket.is_paid ? 'green' : 'red',
                        fontWeight: 'bold',
                      }}
                    >
                      {ticket.is_paid ? '已付款' : '未付款'}
                    </span>
                  </td>
                  {!ticket.is_paid && (
                    <td
                      style={{
                        border: '1px solid #ccc',
                        padding: '8px',
                        textAlign: 'center',
                      }}
                    >
                      <Link
                        to={`/payment/${ticket.id}`}
                        style={{
                          color: '#007bff',
                          textDecoration: 'none',
                          fontWeight: 'bold',
                        }}
                      >
                        前往付款
                      </Link>
                    </td>
                  )}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

export default MyTicket
