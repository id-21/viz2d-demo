import axios from "axios";

const base_url = 'https://api.viz2d.com'

const api = {
    getJobToken: async (visualizerId: string) => await axios.get(base_url+`/v1/visualizers/${visualizerId}/job-token`),
    createJob: async (token: string, inputUrl: string) => await axios.post(base_url+'/v1/jobs', { token, inputUrl }),
    getJobById: async (jobId: string) => await axios.get(base_url+`/v1/jobs/${jobId}`),
}

export default api