const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const TOKEN_KEY = 'jobconnect_token';
const USER_KEY = 'jobconnect_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

 if (!response.ok) {
  let message = 'Request failed';

  if (data?.detail) {
    if (typeof data.detail === 'string') {
      message = data.detail;
    } else if (Array.isArray(data.detail)) {
      message = data.detail
        .map((error) => {
          const field = error.loc?.slice(1).join('.') || 'field';
          return `${field}: ${error.msg}`;
        })
        .join(', ');
    }
  }

  throw new Error(message);
}

  return data;
}

function mapUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    verified: user.verified,
    province: user.province,
    phone: user.phone,
    skills: user.skills || [],
    bio: user.bio,
    rating: user.rating,
    review_count: user.review_count,
    cv_file_name: user.cv_file_name || null,
    cv_available: user.cv_available || false,
  };
}

export const api = {
  async register(formData, role) {
    const data = await request('/auth/register', {
      method: 'POST',
     body: JSON.stringify({
        role: role,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        province: formData.city || null,
        id_number: role === 'worker' ? formData.idNumber || null : null,
        password: formData.password,
      }),
    });
    const user = mapUser(data.user);
    saveAuth(data.access_token, user);
    return { token: data.access_token, user };
  },

  async login(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const user = mapUser(data.user);
    saveAuth(data.access_token, user);
    return { token: data.access_token, user };
  },

  async getMe() {
    const data = await request('/auth/me');
    const user = mapUser(data);
    saveAuth(getToken(), user);
    return user;
  },
    async getNotifications() {
    return request('/notifications');
  },

  async markNotificationAsRead(notificationId) {
    return request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  async markAllNotificationsAsRead() {
    return request('/notifications/read-all', {
      method: 'PATCH',
    });
  },

  async verifyAccount() {
    const data = await request('/auth/verify', { method: 'POST' });
    const user = mapUser(data);
    saveAuth(getToken(), user);
    return user;
  },

  async getEmployerJobs() {
  return request('/employers/jobs');
},

async getEmployerApplications() {
  return request('/employers/all-applications');
},
  async getApplicationCV(jobId, applicationId) {
    const token = getToken();

    const response = await fetch(
      `${API_BASE}/employers/jobs/${jobId}/applications/${applicationId}/cv`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      let message = 'Failed to retrieve CV';

      try {
        const data = await response.json();

        if (data?.detail) {
          message = data.detail;
        }
      } catch {
        // Response was not JSON.
      }

      throw new Error(message);
    }

    return response.blob();
  },
async getJobApplications(jobId) {
  return request(`/employers/jobs/${jobId}/applications`);
},

  async createJob(jobData) {
    return request('/employers/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  async closeJob(jobId) {
    return request(`/employers/jobs/${jobId}/close`, { method: 'POST' });
  },

 async updateApplicationStatus(
  jobId,
  applicationId,
  status,
  rejectionMessage = null
) {
  return request(
    `/employers/jobs/${jobId}/applications/${applicationId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        rejection_message: rejectionMessage,
      }),
    }
  );
},

  async getEmployerApplicationStats() {
    return request('/employers/stats/applications');
  },

  async getWorkers(search = '', skill = '') {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (skill) params.set('skill', skill);
    const query = params.toString();
    return request(`/workers${query ? `?${query}` : ''}`);
  },

  async browseJobs(category = '', province = '') {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (province) params.set('province', province);
    const query = params.toString();
    return request(`/jobs${query ? `?${query}` : ''}`);
  },

  async applyForJob(jobId) {
    return request(`/jobs/${jobId}/apply`, { method: 'POST' });
  },

  async getMyApplications() {
    return request('/workers/me/applications');
  },
    async getNotifications() {
    return request('/notifications');
  },

  async markNotificationAsRead(notificationId) {
    return request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  async markAllNotificationsAsRead() {
    return request('/notifications/read-all', {
      method: 'PATCH',
    });
  },

  async updateWorkerProfile(updates) {
    const data = await request('/workers/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    const user = mapUser(data);
    saveAuth(getToken(), user);
    return user;
  },

    async uploadWorkerCV(file) {
    const formData = new FormData();
    formData.append('file', file);

    const data = await request('/workers/me/cv', {
      method: 'POST',
      body: formData,
    });

    const currentUser = getStoredUser();

    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        cv_file_name: data.cv_file_name || null,
        cv_available: true,
      };

      saveAuth(getToken(), updatedUser);
    }

    return data;
  },
    async getNotifications() {
    return request('/notifications');
  },

  async markNotificationAsRead(notificationId) {
    return request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  async markAllNotificationsAsRead() {
    return request('/notifications/read-all', {
      method: 'PATCH',
    });
  },

  // ---------------------------------------------------------
// CHAT
// ---------------------------------------------------------

async getConversations() {
return request('/chat/conversations');
},

async getOrCreateConversation(userId) {
return request(`/chat/conversations/${userId}`, {
method: 'POST',
});
},

async getConversation(conversationId) {
return request(`/chat/conversations/${conversationId}`);
},

async getMessages(conversationId) {
return request(
`/chat/conversations/${conversationId}/messages`
);
},

async sendMessage(conversationId, message) {
return request(
`/chat/conversations/${conversationId}/messages`,
{
method: 'POST',
body: JSON.stringify({
message,
}),
}
);
},

async markMessageAsRead(messageId) {
return request(`/chat/messages/${messageId}/read`, {
method: 'PATCH',
});
},

async markConversationAsRead(conversationId) {
return request(
`/chat/conversations/${conversationId}/read`,
{
method: 'PATCH',
}
);
},

};
