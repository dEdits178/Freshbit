# API Limits Documentation

## Student Confirmation Endpoint

### Endpoint
```
POST /api/students/{driveId}/confirm
```

### Request Limits
- **Maximum students per request**: 500
- **Payload size limit**: ~10MB (depends on server configuration)
- **Rate limiting**: Check with your infrastructure team

### Response Codes
- **200**: Success
- **400**: Validation error or empty array
- **401**: Authentication required
- **403**: Authorization failed
- **404**: Drive not found or not assigned
- **413**: Payload Too Large (exceeds 500 students limit)

### Best Practices
- For large datasets (>500 students), split into multiple requests
- Use batch processing for better performance
- Monitor response times and implement client-side retry logic

### Example Error Response (413)
```json
{
  "success": false,
  "message": "Payload Too Large",
  "error": "Maximum 500 students allowed per request"
}
```
