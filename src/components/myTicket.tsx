import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'


interface Ticket {
  id: string
  activity_id: string
  // region_id: string; // Removed as it's not in the API response for /list_tickets
  seat_number: number // API might return string, ensure conversion if needed
  status: string // e.g., "UNPAID", "SOLD"
  // is_paid: boolean; // Replaced by status
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

  const fetchActivity = async (id: string): Promise<Activity | null> => {
    try {
      const response = await fetch(`/activities/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json();
        return data
      } else {
        return null;
      }
    } catch (err) {
      return null;
    }
  }

  useEffect(() => {
    const fetchTicketsAndActivities = async () => {
      setLoading(true)
      setError(null)
      setTickets([]) // Clear previous tickets
      setActivities({}) // Clear previous activities

      if (!jwtToken) {
        setError('用戶未認證，無法獲取票務信息。');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/tickets/list_tickets`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json',
          }
        })

        if (response.ok) {
          const data = await response.json()
          const apiTickets: Ticket[] = Array.isArray(data) ? data : (Array.isArray(data.tickets) ? data.tickets : []);
          setTickets(apiTickets);

          if (apiTickets.length > 0) {
            const uniqueActivityIds = Array.from(new Set(apiTickets.map(ticket => ticket.activity_id)));
            
            const activityPromises = uniqueActivityIds.map(id => fetchActivity(id));
            const fetchedActivitiesResults = await Promise.allSettled(activityPromises);
            const newActivities: Record<string, Activity> = {};
            fetchedActivitiesResults.forEach((result, index) => {
              if (result.status === 'fulfilled' && result.value) {
                newActivities[uniqueActivityIds[index]] = result.value;
              }
            });
            setActivities(newActivities);
          } else {
            // No tickets, so no activities to fetch
          }
        } else {
          const errorText = await response.text()
          if (errorText.includes('No tickets found')) {
            setError(null); // No error, just no tickets
          } else {
            setError(errorText || '獲取票務失敗');
          }
        }
      } catch (err: any) {
        setError(err.message || '發生未知錯誤')
      } finally {
        setLoading(false)
      }
    }

    fetchTicketsAndActivities()
  }, [jwtToken]) 

  const filteredTickets = tickets.filter((ticket) => {
    if (!ticket || typeof ticket.status !== 'string') {
        return false; 
    }
    const normalizedStatus = ticket.status.trim().toUpperCase();
    if (filter === 'paid') return normalizedStatus === 'SOLD';
    if (filter === 'unpaid') return normalizedStatus === 'UNPAID';
    return true; 
  });

  if (loading) {
    return <div>正在加載票務信息...</div>
  }

  if (error) {
    return <div>錯誤: {error}</div>
  }

  const getTicketDisplayInfo = (status: string) => {
    if (typeof status !== 'string') {
        return { text: '未知狀態', allowPayment: false, color: 'black' }; 
    }
    const upperStatus = status.trim().toUpperCase();
    switch (upperStatus) {
      case 'UNPAID':
        return { text: '未付款', allowPayment: true, color: 'red' };
      case 'SOLD':
        return { text: '已付款', allowPayment: false, color: 'green' };
      case 'UNSOLD': // Should not typically be seen by a user for their own tickets
        return { text: '未售出', allowPayment: false, color: 'grey' };
      default:
        return { text: upperStatus, allowPayment: false, color: 'black' };
    }
  };

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
                無符合條件的訂單
              </td>
            </tr>
          ) : (
            filteredTickets.map((ticket) => {
              if (!ticket || !ticket.id) {
                return null; 
              }
              const activityData = activities[ticket.activity_id];
              const displayInfo = getTicketDisplayInfo(ticket.status);
              
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
                    {activityData ? activityData.title : (ticket.activity_id ? `活動 ID: ${ticket.activity_id} (資料載入中...)` : '活動資訊錯誤')}
                  </td>
                  <td
                    style={{
                      border: '1px solid #ccc',
                      padding: '8px',
                      textAlign: 'center',
                    }}
                  >
                    {String(ticket.seat_number)}
                  </td>
                  <td
                    colSpan={displayInfo.allowPayment ? 1 : 2}
                    style={{
                      border: '1px solid #ccc',
                      padding: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <span
                      style={{
                        color: displayInfo.color,
                        fontWeight: 'bold',
                      }}
                    >
                      {displayInfo.text}
                    </span>
                  </td>
                  {displayInfo.allowPayment && (
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

export default MyTicket;
