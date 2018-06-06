
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <inttypes.h>
#include <math.h>
#include <float.h>

#include <omp.h>

#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"

#define TJE_IMPLEMENTATION
#include "tiny_jpeg.h"



int img_width, img_height;
float* img_data;

void load_image(const char* filename)
{
	int ch;
	img_data = stbi_loadf(filename, &img_width, &img_height, &ch, 3);
	if (!img_data)
	{
		fprintf(stderr, "failed to load image: %s\n", filename);
		exit(1);
	}
}

void check_ranges()
{
	float minval = FLT_MAX, gminval = FLT_MAX;
	float maxval = 0.0f, gmaxval = 0.0f;
	for (int i = 0; i < img_width * img_height * 3; ++i)
	{
		float v = img_data[i];
		if (minval > v)
			minval = v;
		if (maxval < v)
			maxval = v;
		float g = powf(v, 1.0f / 2.2f);
		if (gminval > g)
			gminval = g;
		if (gmaxval < g)
			gmaxval = g;
	}
	printf("data range (regular): [%f; %f]\n", minval, maxval);
	printf("data range (gamma): [%f; %f]\n", gminval, gmaxval);
}


uint8_t* out_data;
int out_width, out_height, out_comps;

void alloc_image(int w, int h, int c)
{
	if (out_data)
		free(out_data);
	out_width = w;
	out_height = h;
	out_comps = c;
	out_data = (uint8_t*) malloc(c * w * h);
}

void generate_dump()
{
	alloc_image(img_width, img_height, 3);
	for (int i = 0; i < img_width * img_height * 3; ++i)
	{
		int v = powf(img_data[i], 1.0f / 2.2f) * 255;
		out_data[i] = v > 255 ? 255 : v;
	}
}

void ds2x()
{
	uint8_t* src_data = out_data;
	out_data = NULL;
	alloc_image(out_width / 2, out_height / 2, out_comps);
	#pragma omp parallel for
	for (int y = 0; y < out_height; ++y)
	{
		for (int x = 0; x < out_width; ++x)
		{
			for (int c = 0; c < out_comps; ++c)
			{
				out_data[c + out_comps * (x + y * out_width)] = (
					src_data[c + out_comps * (x * 2 + y * 2 * out_width * 2)] +
					src_data[c + out_comps * (x * 2 + 1 + y * 2 * out_width * 2)] +
					src_data[c + out_comps * (x * 2 + (y * 2 + 1) * out_width * 2)] +
					src_data[c + out_comps * (x * 2 + 1 + (y * 2 + 1) * out_width * 2)]) / 4;
			}
		}
	}
	free(src_data);
}

void save_image_jpeg(const char* filename, int qual)
{
	if (!tje_encode_to_file_at_quality(filename, qual, out_width, out_height, out_comps, out_data))
	{
		fprintf(stderr, "failed to save output image: %s\n", filename);
		exit(1);
	}
}


#define PI 3.14159f
static const float INVPI = 1.0f / PI;
static const float INVPI2 = 0.5f / PI;

void sample_hdr_uv(float out[3], float u, float v)
{
	int x0 = floor(u);
	int x1 = x0 + 1 < img_width - 1 ? x0 + 1 : img_width - 1;
	int y0 = floor(v);
	int y1 = y0 + 1 < img_height - 1 ? y0 + 1 : img_height - 1;
	int off00 = (x0 + y0 * img_width) * 3;
	int off10 = (x1 + y0 * img_width) * 3;
	int off01 = (x0 + y1 * img_width) * 3;
	int off11 = (x1 + y1 * img_width) * 3;
	float fx = fmodf(u, 1.0f);
	float fy = fmodf(v, 1.0f);
	float ifx = 1.0f - fx;
	float ify = 1.0f - fy;
	out[0] = img_data[off00 + 0] * ifx * ify + img_data[off10 + 0] * fx * ify + img_data[off01 + 0] * ifx * fy + img_data[off11 + 0] * fx * fy;
	out[1] = img_data[off00 + 1] * ifx * ify + img_data[off10 + 1] * fx * ify + img_data[off01 + 1] * ifx * fy + img_data[off11 + 1] * fx * fy;
	out[2] = img_data[off00 + 2] * ifx * ify + img_data[off10 + 2] * fx * ify + img_data[off01 + 2] * ifx * fy + img_data[off11 + 2] * fx * fy;
}

void sample_hdr_vec(float out[3], float dir[3])
{
	float u = (atan2(dir[1], dir[0]) + PI) * INVPI2;
	float v = acos(dir[2]) * INVPI;
	sample_hdr_uv(out, u * img_width, v * img_height);
}

void vec3_normalize(float vec[3])
{
	float lensq = vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2];
	if (lensq)
	{
		float inv = 1.0f / sqrtf(lensq);
		vec[0] *= inv;
		vec[1] *= inv;
		vec[2] *= inv;
	}
}

void generate_cube_face(int dx, int dy, int w, int h, float dir[3], float up[3], float rt[3])
{
	#pragma omp parallel for
	for (int y = 0; y < h; ++y)
	{
		float fy = ((float)y) / ((float)(h-1)) * -2.0f + 1.0f;
		for (int x = 0; x < w; ++x)
		{
			float val[3];
			float fx = ((float)x) / ((float)(w-1)) * -2.0f + 1.0f;
			float vec[3] =
			{
				dir[0] + rt[0] * fx + up[0] * fy,
				dir[1] + rt[1] * fx + up[1] * fy,
				dir[2] + rt[2] * fx + up[2] * fy,
			};
			vec3_normalize(vec);
			sample_hdr_vec(val, vec);
			// tonemap
#define ACES_TONEMAP
#ifdef ACES_TONEMAP
			// https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/
			val[0] *= 0.6f;
			val[1] *= 0.6f;
			val[2] *= 0.6f;
			static const float a = 2.51f;
			static const float b = 0.03f;
			static const float c = 2.43f;
			static const float d = 0.59f;
			static const float e = 0.14f;
			val[0] = (val[0]*(a*val[0]+b))/(val[0]*(c*val[0]+d)+e);
			val[1] = (val[1]*(a*val[1]+b))/(val[1]*(c*val[1]+d)+e);
			val[2] = (val[2]*(a*val[2]+b))/(val[2]*(c*val[2]+d)+e);
			val[0] = powf(val[0], 1.0f / 2.2f);
			val[1] = powf(val[1], 1.0f / 2.2f);
			val[2] = powf(val[2], 1.0f / 2.2f);
#else
			val[0] = val[0] / (1 + val[0]);
			val[1] = val[1] / (1 + val[1]);
			val[2] = val[2] / (1 + val[2]);
			// gamma
			val[0] = powf(val[0], 1.0f / 2.2f);
			val[1] = powf(val[1], 1.0f / 2.2f);
			val[2] = powf(val[2], 1.0f / 2.2f);
#endif
			// clamp
			if (val[0] > 1) val[0] = 1;
			if (val[1] > 1) val[1] = 1;
			if (val[2] > 1) val[2] = 1;
			// write
			uint8_t* pixel = &out_data[3 * (x + dx + (y + dy) * out_width)];
			pixel[0] = val[0] * 255.0f;
			pixel[1] = val[1] * 255.0f;
			pixel[2] = val[2] * 255.0f;
		}
	}
}

typedef struct CubeFace
{
	float dir[3];
	float up[3];
	float rt[3];
	int x, y;
}
CubeFace;

CubeFace cubeFaces[6] =
{
	{ { 1, 0, 0 }, { 0, 1, 0 }, { 0, 0, 1 }, 0, 0, },
	{ { -1, 0, 0 }, { 0, 1, 0 }, { 0, 0, -1 }, 1, 0, },
	{ { 0, 1, 0 }, { 0, 0, -1 }, { -1, 0, 0 }, 0, 1, },
	{ { 0, -1, 0 }, { 0, 0, 1 }, { -1, 0, 0 }, 1, 1, },
	{ { 0, 0, 1 }, { 0, 1, 0 }, { -1, 0, 0 }, 0, 2, },
	{ { 0, 0, -1 }, { 0, 1, 0 }, { 1, 0, 0 }, 1, 2, },
};


#define SIDE_WIDTH 512
#define SIDE_WIDTH_PRE 128
int main()
{
	load_image("input.hdr");
//	check_ranges();

//	generate_dump();
//	save_image_jpeg("output.jpg");

	alloc_image(SIDE_WIDTH*2, SIDE_WIDTH*3, 3);
	for (int i = 0; i < 6; ++i)
	{
		generate_cube_face(SIDE_WIDTH * cubeFaces[i].x, SIDE_WIDTH * cubeFaces[i].y, SIDE_WIDTH, SIDE_WIDTH, cubeFaces[i].dir, cubeFaces[i].up, cubeFaces[i].rt);
	}
	save_image_jpeg("cubemap.jpg", 2);

	while (out_width > SIDE_WIDTH_PRE)
		ds2x();
	save_image_jpeg("cubemap.preload.jpg", 2);

	stbi_image_free(img_data);
	free(out_data);
	return 0;
}
