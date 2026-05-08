export const emptyCandidate = {
  name: "",
  headline: "",
  profile: "",
  location: "",
  nationality: "",
  education: [],
  languages: [],
  accomplishments: [],
  certifications: [],
  proficiencies: [],
  experience: []
};

export function normaliseCandidate(data = {}) {
  return {
    ...emptyCandidate,
    ...data,
    education: Array.isArray(data.education) ? data.education : [],
    languages: Array.isArray(data.languages) ? data.languages : [],
    accomplishments: Array.isArray(data.accomplishments) ? data.accomplishments : [],
    certifications: Array.isArray(data.certifications) ? data.certifications : [],
    proficiencies: Array.isArray(data.proficiencies) ? data.proficiencies : [],
    experience: Array.isArray(data.experience) ? data.experience : []
  };
}
